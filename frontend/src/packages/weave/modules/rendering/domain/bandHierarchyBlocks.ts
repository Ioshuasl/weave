import {
  type ReportBand,
  type BandLinkPlacement,
  evaluateBandCondition,
  getBandOutputScope,
  getBandRect,
} from '../../band/domain';
import { getTextLineHeight } from '../../components/text/domain';
import { evaluateExpression } from '../../expression/domain';
import { tagLayerScope } from './pageLayoutZones';
import type { PreviewLayer } from './previewTypes';
import type { ReportComponent } from '../../components/common/domain';
import type { ReportData } from '../../data-source/domain';
import type { ReportPage } from '../../page/domain';

/** Bloco indivisível de corpo: nunca é quebrado entre duas folhas. */
export interface PackableBlock {
  height: number;
  layers: PreviewLayer[];
  flow?: boolean;
}

export interface BandHierarchyContext {
  page: ReportPage;
  bands: Record<string, ReportBand>;
  components: Record<string, ReportComponent>;
  data: ReportData;
  /** IDs das bandas na ordem de design */
  orderedIds: string[];
}

type Row = Record<string, unknown>;

const MAX_DEPTH = 8;

function isFlowBand(band: ReportBand | undefined): band is ReportBand {
  return Boolean(band) && getBandOutputScope(band!.type) === 'flow';
}

/** Banda de dados vinculada a um pai válido (também de corpo). */
export function hasValidParent(band: ReportBand, ctx: BandHierarchyContext): boolean {
  const parentId = band.link?.parentBandId;
  if (!parentId || parentId === band.id) return false;
  return isFlowBand(ctx.bands[parentId]) && ctx.orderedIds.includes(parentId);
}

/** Bandas filhas na ordem vertical da folha (empate: ordem de empilhamento). */
function getChildBands(parentId: string, ctx: BandHierarchyContext): ReportBand[] {
  return ctx.orderedIds
    .map((id) => ctx.bands[id])
    .filter(
      (band): band is ReportBand =>
        isFlowBand(band) && band.link?.parentBandId === parentId && band.id !== parentId
    )
    .sort((a, b) => getBandRect(a, ctx.page).y - getBandRect(b, ctx.page).y);
}

function getPlacement(band: ReportBand): BandLinkPlacement {
  return band.link?.placement ?? 'below';
}

function asText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function parseFontSize(value: unknown): number {
  const parsed = parseFloat(asText(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 16;
}

/** Estima as linhas de um texto no retângulo (quebra por palavras; fonte monoespaçada ≈ 0.6em). */
export function estimateTextLines(
  text: string,
  width: number,
  fontSize: number,
  fontFamily?: string
): number {
  const charWidth = fontSize * (/courier|mono/i.test(fontFamily ?? '') ? 0.6 : 0.55);
  const maxChars = Math.max(1, Math.floor(width / charWidth));
  const clean = text.replace(/\*\*|~~|__/g, '');
  let lines = 0;

  for (const paragraph of clean.split('\n')) {
    let current = 0;
    let paragraphLines = 1;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      let remaining = word.length;
      if (current > 0 && current + 1 + remaining <= maxChars) {
        current += 1 + remaining;
        continue;
      }
      if (current > 0) paragraphLines += 1;
      while (remaining > maxChars) {
        paragraphLines += 1;
        remaining -= maxChars;
      }
      current = remaining;
    }
    lines += paragraphLines;
  }

  return Math.max(1, lines);
}

function resolveRowHeight(band: ReportBand, row: Row, ctx: BandHierarchyContext): number {
  // Banda agrupadora (sem componentes, só com filhas) não ocupa altura própria.
  if (band.components.length === 0 && getChildBands(band.id, ctx).length > 0) return 0;

  const base = getBandRect(band, ctx.page).height;
  if (!band.autoHeight) return base;

  let height = base;
  for (const componentId of band.components) {
    const component = ctx.components[componentId];
    if (!component || component.type !== 'text') continue;
    const text = evaluateExpression(component.content, { row, data: ctx.data });
    const fontSize = parseFontSize(component.style.fontSize);
    const lines = estimateTextLines(
      text,
      component.rect.width,
      fontSize,
      asText(component.style.fontFamily)
    );
    const lineHeight = getTextLineHeight(component.style.lineHeight);
    height = Math.max(height, Math.ceil(component.rect.y + lines * fontSize * lineHeight));
  }
  return height;
}

const indexCache = new WeakMap<ReportData, Map<string, Map<string, Row[]>>>();

function getRowsByKey(dataSource: string, field: string, data: ReportData): Map<string, Row[]> {
  let perData = indexCache.get(data);
  if (!perData) {
    perData = new Map();
    indexCache.set(data, perData);
  }
  const cacheKey = `${dataSource}|${field}`;
  const cached = perData.get(cacheKey);
  if (cached) return cached;

  const map = new Map<string, Row[]>();
  for (const row of (data[dataSource] ?? []) as Row[]) {
    const value = row?.[field];
    if (value === undefined || value === null) continue;
    const key = asText(value);
    const bucket = map.get(key);
    if (bucket) bucket.push(row);
    else map.set(key, [row]);
  }
  perData.set(cacheKey, map);
  return map;
}

function resolveRows(band: ReportBand, parentRow: Row | undefined, ctx: BandHierarchyContext): Row[] {
  const rows = resolveLinkedRows(band, parentRow, ctx);
  if (!band.showWhen) return rows;
  return rows.filter((row) => evaluateBandCondition(band.showWhen, { ...parentRow, ...row }));
}

function resolveLinkedRows(
  band: ReportBand,
  parentRow: Row | undefined,
  ctx: BandHierarchyContext
): Row[] {
  const link = band.link;
  if (!link || !parentRow) {
    return band.dataSource ? ((ctx.data[band.dataSource] ?? []) as Row[]) : [];
  }
  if (!link.parentField) return [parentRow];
  const key = parentRow[link.parentField];
  if (key === undefined || key === null || !band.dataSource) return [];
  return getRowsByKey(band.dataSource, link.field ?? link.parentField, ctx.data).get(asText(key)) ?? [];
}

interface FlatRow {
  layers: PreviewLayer[];
  height: number;
}

function shiftLayers(layers: PreviewLayer[], offsetY: number): PreviewLayer[] {
  return layers.map((layer) => ({ ...layer, blockY: (layer.blockY ?? 0) + offsetY }));
}

/**
 * Achata uma linha da banda, com filhas "antes" / "ao lado" / "depois", em camadas posicionadas
 * dentro do bloco. `scope` limita quais filhas entram (para separar blocos quando não há "manter junto").
 */
function flattenRow(
  band: ReportBand,
  row: Row,
  ancestor: Row,
  path: string,
  depth: number,
  include: { above: boolean; below: boolean },
  ctx: BandHierarchyContext
): FlatRow {
  const rowCtx: Row = { ...ancestor, ...row };
  const baseRect = getBandRect(band, ctx.page);
  const rowHeight = resolveRowHeight(band, rowCtx, ctx);
  const orderIndex = ctx.orderedIds.indexOf(band.id);
  const children = depth < MAX_DEPTH ? getChildBands(band.id, ctx) : [];

  const stackChildren = (placement: BandLinkPlacement, startY: number): FlatRow => {
    let y = startY;
    let tallest = 0;
    const layers: PreviewLayer[] = [];

    for (const child of children.filter((item) => getPlacement(item) === placement)) {
      let childY = placement === 'beside' ? startY : y;
      resolveRows(child, rowCtx, ctx).forEach((childRow, index) => {
        const flat = flattenRow(child, childRow, rowCtx, `${path}/${child.id}-${index}`, depth + 1, { above: true, below: true }, ctx);
        layers.push(...shiftLayers(flat.layers, childY));
        childY += flat.height;
      });
      if (placement === 'beside') tallest = Math.max(tallest, childY - startY);
      else y = childY;
    }

    return { layers, height: placement === 'beside' ? tallest : y - startY };
  };

  const above = include.above ? stackChildren('above', 0) : { layers: [], height: 0 };
  const masterY = above.height;
  const beside = stackChildren('beside', masterY);
  const masterLayer = tagLayerScope(
    {
      key: `${band.id}-${path}`,
      bandId: band.id,
      rect: { ...baseRect, y: 0, height: rowHeight },
      zIndex: orderIndex + 1,
      kind: 'data-row',
      rowIndex: 0,
      row: rowCtx,
      blockY: masterY,
    },
    { [band.id]: band }
  );
  const belowStart = masterY + Math.max(rowHeight, beside.height);
  const below = include.below ? stackChildren('below', belowStart) : { layers: [], height: 0 };

  // A linha pai + filhas "ao lado"/"depois" formam UM registro (as filhas "antes" ficam de fora): a chave mais externa vale
  const hasChildren = beside.layers.length + below.layers.length > 0;
  const registro = (list: PreviewLayer[]) => (hasChildren ? list.map((layer) => ({ ...layer, groupKey: `${band.id}-${path}` })) : list);

  return {
    layers: [...above.layers, ...registro([masterLayer, ...beside.layers, ...below.layers])],
    height: belowStart + below.height,
  };
}

/** Blocos de corpo de uma banda (raiz ou filha) para todas as suas linhas. */
export function buildHierarchicalBlocks(
  band: ReportBand,
  parentRow: Row | undefined,
  path: string,
  depth: number,
  ctx: BandHierarchyContext
): PackableBlock[] {
  const rows = resolveRows(band, parentRow, ctx);
  const blocks: PackableBlock[] = [];

  rows.forEach((row, index) => {
    const rowPath = `${path}${band.id}-${index}`;
    const ancestor: Row = parentRow ?? {};
    const rowCtx: Row = { ...ancestor, ...row };

    if (band.keepTogether || depth >= MAX_DEPTH) {
      const flat = flattenRow(band, row, ancestor, rowPath, depth, { above: true, below: true }, ctx);
      blocks.push({ height: flat.height, layers: flat.layers, flow: true });
      return;
    }

    const children = getChildBands(band.id, ctx);
    for (const child of children.filter((item) => getPlacement(item) === 'above')) {
      blocks.push(...buildHierarchicalBlocks(child, rowCtx, `${rowPath}/`, depth + 1, ctx));
    }

    const head = flattenRow(band, row, ancestor, rowPath, depth, { above: false, below: false }, ctx);
    blocks.push({ height: head.height, layers: head.layers, flow: true });

    for (const child of children.filter((item) => getPlacement(item) === 'below')) {
      blocks.push(...buildHierarchicalBlocks(child, rowCtx, `${rowPath}/`, depth + 1, ctx));
    }
  });

  return blocks;
}
