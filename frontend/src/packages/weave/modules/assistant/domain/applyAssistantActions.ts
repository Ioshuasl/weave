import { createId } from '../../../shared/domain/id';
import { applyBandLinesPreset } from '../../band/domain';
import { getDefaultComponentSize, mergeBorderPatch } from '../../components/common/domain';
import { buildNewComponent } from '../../designer/domain/componentFactory';
import { detectLayoutColumns, relayoutColumns } from './assistantColumns';
import { ELEMENT_PROPERTIES, LINES_PRESET_VALUES, REMOVE, STYLE_PROPERTIES, normalizePropertyValue, type PropertyDefinition } from './assistantPropertyCatalog';
import type { AssistantAction, AssistantApplyResult } from './assistantTypes';
import type { DataTableColumn } from '../../band/domain';
import type { ReportComponent } from '../../components/common/domain';
import type { ReportDefinition } from '../../report/domain';

const COMPONENT_GAP = 8;

/** Grava `valor` no caminho `a.b.c` sem mutar o original; `REMOVE`/'' apaga a folha. */
function setIn(target: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const [head, ...rest] = path;
  if (!rest.length) {
    const { [head]: _old, ...others } = target;
    return value === REMOVE || value === '' ? others : { ...others, [head]: value };
  }
  return { ...target, [head]: setIn((target[head] as Record<string, unknown>) ?? {}, rest, value) };
}

const appliesTo = (def: PropertyDefinition, type: string) => def.aplica.includes('*') || def.aplica.includes(type);

/** Aplica só as propriedades do catálogo válidas para o tipo; devolve null se nada pôde ser aplicado. */
function patchProperties<T extends object>(
  target: T,
  type: string,
  entries: [string, PropertyDefinition | undefined, unknown][]
): T | null {
  let next = target as Record<string, unknown>;
  let changed = false;
  for (const [, def, raw] of entries) {
    if (!def || !appliesTo(def, type)) continue;
    const value = normalizePropertyValue(def, raw);
    if (value === null) continue;
    next = setIn(next, def.path.split('.'), value);
    changed = true;
  }
  return changed ? (next as T) : null;
}

const styleEntries = (estilo: Record<string, string | undefined>): [string, PropertyDefinition | undefined, unknown][] =>
  Object.entries(estilo).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, STYLE_PROPERTIES[k], v]);

/**
 * Aplica as ações do assistente num relatório e devolve a nova definição (sem mutar a original).
 * Ação cujo alvo não existe mais (ex.: usuário apagou enquanto a IA respondia) é ignorada.
 */
export function applyAssistantActions(
  report: ReportDefinition,
  actions: AssistantAction[]
): AssistantApplyResult & { report: ReportDefinition } {
  let next = report;
  let applied = 0;

  for (const action of actions) {
    const component = 'componente_id' in action && action.componente_id ? next.components[action.componente_id] : undefined;
    const band = 'banda_id' in action && action.banda_id ? next.bands[action.banda_id] : undefined;

    if (action.tipo === 'adicionar_texto' && band) {
      const bottom = band.components.reduce((max, id) => {
        const rect = next.components[id]?.rect;
        return rect ? Math.max(max, rect.y + rect.height) : max;
      }, 0);
      const styled = patchProperties({ style: {} } as ReportComponent, 'text', styleEntries(action.estilo ?? {}));
      const styledStyle = styled?.style ? mergeBorderPatch({}, styled.style) : undefined;
      const created = buildNewComponent(band.id, 'text', {
        content: action.conteudo,
        style: styledStyle,
        rect: { x: 10, y: bottom ? bottom + COMPONENT_GAP : 10, ...getDefaultComponentSize('text') },
      });
      const needed = created.rect.y + created.rect.height + 10;
      next = {
        ...next,
        components: { ...next.components, [created.id]: created },
        bands: {
          ...next.bands,
          [band.id]: {
            ...band,
            height: band.bandRect ? band.height : Math.max(band.height, needed),
            components: [...band.components, created.id],
          },
        },
      };
    } else if (action.tipo === 'alterar_texto' && component?.type === 'text') {
      next = { ...next, components: { ...next.components, [component.id]: { ...component, content: action.conteudo } } };
    } else if (action.tipo === 'alterar_estilo' && component) {
      const patched = patchProperties(component, component.type, styleEntries(action.estilo));
      if (!patched) continue;
      // borda e bordas por lado juntas: o atalho e os lados nunca ficam em conflito
      const fixed = { ...patched, style: mergeBorderPatch(component.style, patched.style) };
      next = { ...next, components: { ...next.components, [component.id]: fixed } };
    } else if (action.tipo === 'aplicar_estilo_linhas' && LINES_PRESET_VALUES[action.estilo]) {
      next = applyBandLinesPreset(next, LINES_PRESET_VALUES[action.estilo]);
    } else if (action.tipo === 'alterar_propriedade' && (component || band)) {
      const def = ELEMENT_PROPERTIES[action.propriedade];
      const patched = component
        ? patchProperties(component, component.type, [[action.propriedade, def, action.valor]])
        : patchProperties(band!, band!.type, [[action.propriedade, def, action.valor]]);
      if (!patched) continue;
      next = component
        ? { ...next, components: { ...next.components, [component.id]: patched as ReportComponent } }
        : { ...next, bands: { ...next.bands, [band!.id]: patched as typeof band & object } };
    } else if (action.tipo === 'vincular_campo' && component?.type === 'text') {
      next = { ...next, components: { ...next.components, [component.id]: { ...component, content: `{${action.fonte}.${action.campo}}` } } };
    } else if (action.tipo === 'adicionar_coluna_tabela' && band?.type === 'dataTable') {
      const column: DataTableColumn = { id: createId(), field: action.campo, header: action.titulo, align: action.alinhamento ?? 'left' };
      const table = band.dataTable ?? { columns: [] };
      next = { ...next, bands: { ...next.bands, [band.id]: { ...band, dataTable: { ...table, columns: [...table.columns, column] } } } };
    } else if (action.tipo === 'remover_coluna_tabela' && band?.dataTable?.columns.some((c) => c.id === action.coluna_id)) {
      const columns = band.dataTable.columns.filter((c) => c.id !== action.coluna_id);
      next = { ...next, bands: { ...next.bands, [band.id]: { ...band, dataTable: { ...band.dataTable, columns } } } };
    } else if (action.tipo === 'remover_componente' && component) {
      const components = { ...next.components };
      delete components[component.id];
      const parent = next.bands[component.parentId];
      next = {
        ...next,
        components,
        bands: parent ? { ...next.bands, [parent.id]: { ...parent, components: parent.components.filter((id) => id !== component.id) } } : next.bands,
      };
    } else if (action.tipo === 'alterar_condicao_banda' && band) {
      const { showWhen: _previous, ...rest } = band;
      const showWhen =
        action.operador === 'remover' || !action.campo
          ? undefined
          : { field: action.campo, operator: action.operador, value: action.valor ?? '' };
      next = { ...next, bands: { ...next.bands, [band.id]: showWhen ? { ...rest, showWhen } : rest } };
    } else if (
      action.tipo === 'trocar_colunas' ||
      action.tipo === 'mover_coluna' ||
      action.tipo === 'alterar_largura_coluna'
    ) {
      const original = detectLayoutColumns(next);
      const target = original.find((c) => c.id === ('coluna' in action ? action.coluna : action.coluna_a));
      const other = original.find((c) => c.id === (action.tipo === 'trocar_colunas' ? action.coluna_b : action.tipo === 'mover_coluna' ? action.depois_de : ''));
      if (!target || (action.tipo === 'trocar_colunas' && !other) || (action.tipo === 'mover_coluna' && action.depois_de && !other)) continue;

      let order = original;
      let widths: Record<string, number> = {};
      if (action.tipo === 'trocar_colunas') {
        order = original.map((c) => (c.id === target.id ? other! : c.id === other!.id ? target : c));
      } else if (action.tipo === 'mover_coluna') {
        const rest = original.filter((c) => c.id !== target.id);
        const at = other ? rest.findIndex((c) => c.id === other.id) + 1 : 0;
        order = [...rest.slice(0, at), target, ...rest.slice(at)];
      } else {
        widths = { [target.id]: Math.min(600, Math.max(20, Math.round(action.largura))) };
      }
      next = relayoutColumns(next, original, order, widths);
    } else {
      continue;
    }
    applied += 1;
  }

  return { report: next, applied, skipped: actions.length - applied };
}
