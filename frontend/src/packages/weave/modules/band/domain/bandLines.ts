import type { ReportBand } from './band';
import type { Rect } from '../../../shared/domain/geometry';
import type { ReportComponent } from '../../components/common/domain';

export type BandLinesThickness = 'thin' | 'medium';

/**
 * Linhas de divisão da lista. Cada banda de dados vira uma linha repetida por registro:
 * - `rows`: linha embaixo de cada registro;
 * - `columns`: linhas verticais entre as colunas;
 * - `sides`: linhas nas laterais (esquerda e direita);
 * - `outline`: caixa ao redor da linha (para textos de linha única, como o encerramento);
 * - `header`: o título das colunas (outra banda, alinhado às colunas) recebe a mesma grade;
 * - `fillPage`: as linhas das colunas continuam até o fim da folha, nos espaços vazios.
 */
export interface BandLines {
  rows?: boolean;
  columns?: boolean;
  sides?: boolean;
  outline?: boolean;
  header?: boolean;
  fillPage?: boolean;
  thickness?: BandLinesThickness;
  /** `#rrggbb` — padrão preto */
  color?: string;
}

export interface LineRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type BandLinesPreset = 'none' | 'simple' | 'grid';
export const BAND_LINES_PRESETS: BandLinesPreset[] = ['none', 'simple', 'grid'];

const DEFAULT_COLOR = '#000000';
const TOLERANCE = 1.5;
const near = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE;

export const getBandLinesThicknessPx = (lines?: BandLines): number => (lines?.thickness === 'medium' ? 2 : 1);
export const getBandLinesColor = (lines?: BandLines): string => lines?.color ?? DEFAULT_COLOR;

export const hasBandLines = (lines?: BandLines): boolean =>
  Boolean(lines && (lines.rows || lines.columns || lines.sides || lines.outline));

type Bands = Record<string, ReportBand>;
type Components = Record<string, ReportComponent>;

const textsOf = (band: ReportBand, components: Components): ReportComponent[] =>
  band.components.map((id) => components[id]).filter((c): c is ReportComponent => Boolean(c) && c.type === 'text');

/** Bordas de textos separadas por até este vão (px) contam como UMA divisa de coluna (a linha fica no meio do vão). */
const COLUMN_GAP_JOIN = 8;
/** Bordas a até esta distância das pontas são as laterais da lista, não divisas internas. */
const COLUMN_EDGE_MARGIN = 8;

/** Posições verticais entre as colunas (bordas internas dos textos lado a lado), sem as laterais. */
export function computeColumnBoundaries(band: ReportBand, components: Components, innerWidth: number): number[] {
  const edges = textsOf(band, components)
    .flatMap((c) => [c.rect.x, c.rect.x + c.rect.width])
    .sort((a, b) => a - b);
  const clusters: number[][] = [];
  for (const edge of edges) {
    const last = clusters[clusters.length - 1];
    if (last && edge - last[last.length - 1] <= COLUMN_GAP_JOIN) last.push(edge);
    else clusters.push([edge]);
  }
  return clusters
    .map((cluster) => (cluster[0] + cluster[cluster.length - 1]) / 2)
    .filter((x) => x > COLUMN_EDGE_MARGIN && x < innerWidth - COLUMN_EDGE_MARGIN);
}

/** Linhas da PRÓPRIA banda (uma linha de registro). Coordenadas relativas ao topo-esquerdo da caixa da linha. */
function ownLineRects(band: ReportBand, components: Components, box: { width: number; height: number }, inset: number): LineRect[] {
  const lines = band.lines;
  if (!lines) return [];
  const t = getBandLinesThicknessPx(lines);
  const rects: LineRect[] = [];
  const { width, height } = box;
  if (lines.outline) {
    rects.push({ x: 0, y: 0, width, height: t }, { x: 0, y: height - t, width, height: t }, { x: 0, y: 0, width: t, height }, { x: width - t, y: 0, width: t, height });
    return rects;
  }
  if (lines.rows) rects.push({ x: 0, y: height - t, width, height: t });
  if (lines.sides) rects.push({ x: 0, y: 0, width: t, height }, { x: width - t, y: 0, width: t, height });
  if (lines.columns) {
    for (const x of computeColumnBoundaries(band, components, width - inset)) rects.push({ x: Math.round(inset + x - t / 2), y: 0, width: t, height });
  }
  return rects;
}

/**
 * Linhas que devem ser desenhadas dentro de uma banda: as dela (linha de registro) e, se for o caso,
 * a caixa do título das colunas contribuída por uma lista com `lines.header`.
 */
export function computeBandLineRects(
  band: ReportBand,
  ctx: { bands: Bands; components: Components },
  box: { width: number; height: number },
  inset = 0
): { color: string; rects: LineRect[] }[] {
  const out: { color: string; rects: LineRect[] }[] = [];
  const own = ownLineRects(band, ctx.components, box, inset);
  if (own.length) out.push({ color: getBandLinesColor(band.lines), rects: own });

  const myTexts = textsOf(band, ctx.components);
  for (const list of Object.values(ctx.bands)) {
    if (list.id === band.id || !list.lines?.header || !(list.lines.columns || list.lines.rows || list.lines.sides)) continue;
    const listTexts = textsOf(list, ctx.components);
    const cohort = myTexts.filter((c) => listTexts.some((l) => near(l.rect.x, c.rect.x) && near(l.rect.width, c.rect.width)));
    if (cohort.length < 2) continue; // precisa ser um título de colunas, não um texto solto
    const t = getBandLinesThicknessPx(list.lines);
    // a caixa acompanha as laterais da lista: bordas das células a poucos px da ponta da banda viram a própria ponta
    const rawX0 = Math.min(...cohort.map((c) => c.rect.x));
    const rawX1 = Math.max(...cohort.map((c) => c.rect.x + c.rect.width));
    const x0 = rawX0 <= COLUMN_EDGE_MARGIN ? 0 : rawX0;
    const x1 = box.width - rawX1 <= COLUMN_EDGE_MARGIN ? box.width : rawX1;
    const y0 = Math.min(...cohort.map((c) => c.rect.y));
    const y1 = Math.max(...cohort.map((c) => c.rect.y + c.rect.height));
    const rects: LineRect[] = [
      { x: x0, y: y0, width: x1 - x0, height: t },
      { x: x0, y: y1 - t, width: x1 - x0, height: t },
    ];
    if (list.lines.sides || list.lines.columns) rects.push({ x: x0, y: y0, width: t, height: y1 - y0 }, { x: x1 - t, y: y0, width: t, height: y1 - y0 });
    if (list.lines.columns) {
      for (const x of computeColumnBoundaries(list, ctx.components, x1)) {
        if (x > x0 + TOLERANCE) rects.push({ x: Math.round(x - t / 2), y: y0, width: t, height: y1 - y0 });
      }
    }
    out.push({ color: getBandLinesColor(list.lines), rects });
  }
  return out;
}

/** Linhas das colunas nos espaços vazios da folha (abaixo da última banda do corpo até o rodapé). */
export function computeFillPageLineRects(
  band: ReportBand,
  components: Components,
  listRect: Rect,
  inset: number,
  fillFromY: number,
  fillToY: number
): { color: string; rects: LineRect[] } | null {
  const lines = band.lines;
  if (!lines?.fillPage || !(lines.columns || lines.sides) || fillToY - fillFromY < 2) return null;
  const t = getBandLinesThicknessPx(lines);
  const height = fillToY - fillFromY;
  const rects: LineRect[] = [];
  if (lines.sides || lines.columns) rects.push({ x: listRect.x, y: fillFromY, width: t, height }, { x: listRect.x + listRect.width - t, y: fillFromY, width: t, height });
  if (lines.columns) {
    for (const x of computeColumnBoundaries(band, components, listRect.width - inset)) rects.push({ x: Math.round(listRect.x + inset + x - t / 2), y: fillFromY, width: t, height });
  }
  return { color: getBandLinesColor(lines), rects };
}

export const isLinesBand = (band: ReportBand) => ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'].includes(band.type);

/** A lista tem título de colunas: textos de OUTRA banda alinhados (x e largura) com pelo menos metade das células da linha (e no mínimo 2). */
function hasAlignedColumnHeader(band: ReportBand, row: ReportComponent[], bands: Bands, components: Components): boolean {
  const others = Object.values(bands)
    .filter((b) => b.id !== band.id)
    .flatMap((b) => textsOf(b, components));
  const aligned = row.filter((c) => others.some((o) => near(o.rect.x, c.rect.x) && near(o.rect.width, c.rect.width))).length;
  return aligned >= Math.max(2, Math.ceil(row.length / 2));
}

/**
 * Estilo de linhas da folha em um clique ("Grade de cartório", "Linhas simples", "Sem linhas").
 * - lista com colunas E título de colunas alinhado: grade (ou só linhas entre registros);
 * - lista de vários textos SEM título de colunas alinhado (ex.: protocolo/pessoas/lavratura): só linha entre os registros,
 *   nunca divisórias verticais nem grade até o fim da folha;
 * - texto largo de uma linha só (ex.: encerramento): contorno (grade) ou linha embaixo (simples).
 * `none` limpa tudo.
 */
export function applyBandLinesPreset<R extends { bands: Bands; components: Components }>(report: R, preset: BandLinesPreset): R {
  const bands: Bands = {};
  for (const [id, band] of Object.entries(report.bands)) {
    const { lines: _old, ...rest } = band;
    if (preset === 'none' || !isLinesBand(band)) { bands[id] = preset === 'none' ? rest : band; continue; }
    const texts = textsOf(band, report.components);
    const row = texts.filter((c) => near(c.rect.y, texts[0]?.rect.y ?? 0));
    const innerWidth = Math.max(...texts.map((c) => c.rect.x + c.rect.width), 0);
    const isColumnsWithHeader = row.length >= 3 && hasAlignedColumnHeader(band, row, report.bands, report.components);
    const isSingleLine = texts.length === 1 && innerWidth > 0 && texts[0].rect.width >= innerWidth * 0.8;
    if (isColumnsWithHeader) {
      bands[id] = { ...rest, lines: preset === 'grid'
        ? { rows: true, columns: true, sides: true, header: true, fillPage: true, thickness: 'thin' }
        : { rows: true, header: true, thickness: 'thin' } };
    } else if (isSingleLine) {
      bands[id] = { ...rest, lines: preset === 'grid' ? { outline: true, thickness: 'thin' } : { rows: true, thickness: 'thin' } };
    } else if (texts.length >= 2) {
      bands[id] = { ...rest, lines: { rows: true, thickness: 'thin' } };
    } else {
      bands[id] = band;
    }
  }
  return { ...report, bands };
}

/** Banda de colunas = ≥3 textos lado a lado na mesma linha (a lista de registros). */
export function isColumnsBand(band: ReportBand, components: Components): boolean {
  const texts = textsOf(band, components);
  return texts.filter((c) => near(c.rect.y, texts[0]?.rect.y ?? 0)).length >= 3;
}

export type BandLinesChoice = 'none' | 'rows' | 'grid' | 'outline';

/** Escolha simples da tela ("Nenhuma", "Entre os registros", "Grade completa", "Contorno") a partir das linhas. */
export function getBandLinesChoice(lines?: BandLines): BandLinesChoice {
  if (!hasBandLines(lines)) return 'none';
  if (lines?.outline) return 'outline';
  if (lines?.columns) return 'grid';
  return 'rows';
}

/** Linhas correspondentes a uma escolha, preservando espessura e cor já escolhidas. */
export function buildBandLinesFromChoice(choice: BandLinesChoice, previous?: BandLines): BandLines | undefined {
  if (choice === 'none') return undefined;
  const keep = { thickness: previous?.thickness ?? 'thin', ...(previous?.color ? { color: previous.color } : {}) } as Pick<BandLines, 'thickness' | 'color'>;
  if (choice === 'outline') return { outline: true, ...keep };
  if (choice === 'rows') return { rows: true, header: previous?.header ?? true, ...keep };
  return { rows: true, columns: true, sides: true, header: previous?.header ?? true, fillPage: previous?.fillPage ?? false, ...keep };
}
