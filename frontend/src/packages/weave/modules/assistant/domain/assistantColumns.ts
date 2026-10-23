import { richTextToPlainText } from '../../components/text/domain';
import type { AssistantLayoutColumn } from './assistantTypes';
import type { ReportComponent } from '../../components/common/domain';
import type { ReportDefinition } from '../../report/domain';

const TOLERANCE = 1.5;
const near = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE;
const TOKEN = /\{([^{}]+)\}/;

const textsOf = (report: ReportDefinition, ids: string[]): ReportComponent[] =>
  ids.map((id) => report.components[id]).filter((c): c is ReportComponent => Boolean(c) && c.type === 'text');

/**
 * Detecta colunas de listagens feitas com textos lado a lado: uma banda de dados com ≥3 textos na mesma linha
 * cujo x/largura se repete em textos de outras bandas (cabeçalho da coluna). Ordenadas por x.
 */
export function detectLayoutColumns(report: ReportDefinition): AssistantLayoutColumn[] {
  const byKey = new Map<string, AssistantLayoutColumn & { hasToken: boolean }>();

  for (const band of Object.values(report.bands)) {
    const texts = textsOf(report, band.components);
    const row = texts.filter((c) => near(c.rect.y, texts[0]?.rect.y ?? 0));
    if (row.length < 3) continue;

    const others = Object.values(report.bands)
      .filter((b) => b.id !== band.id)
      .flatMap((b) => textsOf(report, b.components));
    const columns = row.map((c) => ({
      c,
      cohort: others.filter((o) => near(o.rect.x, c.rect.x) && near(o.rect.width, c.rect.width)),
    }));
    if (columns.filter((x) => x.cohort.length).length < row.length / 2) continue;

    const hasToken = row.some((c) => TOKEN.test(c.content));
    for (const { c, cohort } of columns) {
      const key = `${Math.round(c.rect.x)}|${Math.round(c.rect.width)}`;
      const previous = byKey.get(key);
      if (previous && (previous.hasToken || !hasToken)) continue;
      const label = cohort.map((o) => richTextToPlainText(o.content).trim()).find((t) => t && !TOKEN.test(t)) ?? '';
      byKey.set(key, {
        id: c.id,
        rotulo: label,
        campo: TOKEN.exec(c.content)?.[1] ?? '',
        banda_id: band.id,
        x: Math.round(c.rect.x),
        largura: Math.round(c.rect.width),
        componentes: [c.id, ...cohort.map((o) => o.id)],
        hasToken,
      });
    }
  }

  return [...byKey.values()]
    .sort((a, b) => a.x - b.x)
    .map(({ hasToken: _hasToken, ...column }) => column);
}

/** Reposiciona as colunas na ordem dada, mantendo as folgas originais entre posições. */
export function relayoutColumns(
  report: ReportDefinition,
  original: AssistantLayoutColumn[],
  order: AssistantLayoutColumn[],
  widths: Record<string, number> = {}
): ReportDefinition {
  const left = original[0].x;
  const gaps = original.slice(0, -1).map((c, i) => original[i + 1].x - (c.x + c.largura));
  const components = { ...report.components };
  let cursor = left;
  order.forEach((column, index) => {
    const width = widths[column.id] ?? column.largura;
    for (const id of column.componentes) {
      const component = components[id];
      if (component) components[id] = { ...component, rect: { ...component.rect, x: cursor, width } };
    }
    cursor += width + (gaps[index] ?? 0);
  });
  return { ...report, components };
}
