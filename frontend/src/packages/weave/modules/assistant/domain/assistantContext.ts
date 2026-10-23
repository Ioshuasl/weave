import { richTextToPlainText } from '../../components/text/domain';
import { type DataSourceCatalog, getDataFieldLabel } from '../../data-source/domain';
import { getRowFields } from '../../designer/domain/groupedList';
import { detectLayoutColumns } from './assistantColumns';
import type { AssistantRequest } from './assistantTypes';
import type { ReportDefinition } from '../../report/domain';

/** Corta o texto no limite do contrato da API (texto maior faria a API recusar o pedido inteiro). */
const cut = (value: string, max: number): string => (value.length > max ? value.slice(0, max) : value);

/** Resumo enxuto do relatório (sem dados de preview) enviado ao assistente — respeita os limites da API. */
export function buildAssistantContext(
  report: ReportDefinition,
  data: Record<string, unknown[]>,
  catalog: DataSourceCatalog,
  selectedIds: string[]
): Pick<AssistantRequest, 'relatorio' | 'campos' | 'selecao' | 'colunas_layout'> {
  const bandIds = report.pages.flatMap((page) => [...page.bands, ...(page.dividers ?? [])]);
  const bandas = [...new Set(bandIds)]
    .filter((id) => report.bands[id])
    .slice(0, 60)
    .map((id) => {
      const band = report.bands[id];
      return {
        id,
        tipo: band.type,
        nome: cut(band.name ?? '', 80),
        fonte: band.dataSource ?? '',
        // Lista encadeada: a banda filha forma UM registro com a pai (ex.: Pessoas e Lavratura são partes de Protocolo)
        vinculo: band.link ? { pai: cut(band.link.parentBandId, 64), posicao: cut(String(band.link.placement ?? ''), 16) } : null,
        linhas: band.lines ? { ...band.lines } : null,
        condicao: band.showWhen ? { campo: band.showWhen.field, operador: band.showWhen.operator, valor: band.showWhen.value ?? '' } : null,
        colunas: (band.dataTable?.columns ?? []).slice(0, 40).map((c) => ({ id: c.id, campo: c.field, titulo: cut(c.header ?? '', 80) })),
        componentes: band.components
          .filter((cid) => report.components[cid])
          .slice(0, 40)
          .map((cid) => {
            const c = report.components[cid];
            return { id: cid, tipo: c.type, nome: cut(c.name ?? '', 80), conteudo: c.type === 'text' ? cut(richTextToPlainText(c.content ?? ''), 2000) : '' };
          }),
      };
    });

  const campos = [...new Set([...Object.keys(data), ...Object.keys(catalog)])].flatMap((fonte) => {
    const fields = [...new Set([...getRowFields(data[fonte]), ...Object.keys(catalog[fonte]?.fields ?? {})])];
    return fields.map((campo) => ({ fonte, campo, rotulo: cut(getDataFieldLabel(fonte, campo, catalog), 80) }));
  });

  return {
    relatorio: { bandas },
    campos: campos.slice(0, 300),
    colunas_layout: detectLayoutColumns(report).slice(0, 40).map(({ componentes: _componentes, ...column }) => column),
    selecao: {
      componentes: selectedIds.filter((id) => report.components[id]).slice(0, 50),
      bandas: selectedIds.filter((id) => report.bands[id]).slice(0, 50),
    },
  };
}
