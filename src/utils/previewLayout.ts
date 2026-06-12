import type { ReportBand, ReportData, ReportPage, Rect } from '../types/report';
import {
  getBandOutputScope,
  type BandOutputScope,
  type OutputPageContext,
} from './bandScopeUtils';
import {
  getAllPlacedBandIds,
  getBandRect,
  getPageContentSize,
} from './reportPageUtils';
import { isDataBand, isTableDataBand } from './dataBandUtils';

export type PreviewLayerKind =
  | 'divider'
  | 'static'
  | 'data-row'
  | 'data-table';

export interface PreviewLayer {
  key: string;
  bandId: string;
  rect: Rect;
  zIndex: number;
  kind: PreviewLayerKind;
  /** Escopo de saída (Fase 3.2) — preenchido na paginação runtime */
  scope?: BandOutputScope;
  row?: Record<string, unknown>;
  rowIndex?: number;
}

const TABLE_HEADER_HEIGHT = 34;
const TABLE_ROW_HEIGHT = 30;

function estimateTableHeight(band: ReportBand, rowCount: number): number {
  const showHeader = band.dataTable?.showHeader !== false;
  const header = showHeader ? TABLE_HEADER_HEIGHT : 0;
  const rows = rowCount * TABLE_ROW_HEIGHT;
  return header + rows + 2;
}

function shouldIncludeBandForOutputPage(
  scope: BandOutputScope,
  context: OutputPageContext
): boolean {
  switch (scope) {
    case 'everyPage':
    case 'flow':
      return true;
    case 'once':
      return context.isFirstOutputPage;
    case 'onceLast':
      return context.isLastOutputPage;
    default:
      return true;
  }
}

/**
 * Monta camadas para perfil contínuo (cupom/bobina): empilha bandas em sequência,
 * expande listas e posiciona resumo após os dados (ignora Y absoluto do design).
 */
export function buildContinuousPreviewLayers(
  page: ReportPage,
  bands: Record<string, ReportBand>,
  data: ReportData
): PreviewLayer[] {
  const layers: PreviewLayer[] = [];
  const orderedIds = getAllPlacedBandIds(page, bands);
  let cursorY = 0;

  orderedIds.forEach((bandId, orderIndex) => {
    const band = bands[bandId];
    if (!band) return;

    const baseRect = getBandRect(band, page);
    const zIndex = orderIndex + 1;
    const scope = getBandOutputScope(band.type);

    if (band.type === 'divider') {
      layers.push({
        key: bandId,
        bandId,
        rect: { ...baseRect, y: cursorY },
        zIndex,
        kind: 'divider',
        scope,
      });
      cursorY += baseRect.height;
      return;
    }

    if (isDataBand(band.type) && band.dataSource && data[band.dataSource]?.length) {
      const rows = data[band.dataSource] as Record<string, unknown>[];

      if (isTableDataBand(band)) {
        const tableHeight = Math.max(
          baseRect.height,
          estimateTableHeight(band, rows.length)
        );
        layers.push({
          key: bandId,
          bandId,
          rect: { ...baseRect, y: cursorY, height: tableHeight },
          zIndex,
          kind: 'data-table',
          scope,
        });
        cursorY += tableHeight;
        return;
      }

      rows.forEach((row, index) => {
        layers.push({
          key: `${bandId}-${index}`,
          bandId,
          rect: { ...baseRect, y: cursorY, height: baseRect.height },
          zIndex,
          kind: 'data-row',
          rowIndex: index,
          row,
          scope,
        });
        cursorY += baseRect.height;
      });
      return;
    }

    if (isDataBand(band.type) && band.dataSource && !data[band.dataSource]?.length) {
      layers.push({
        key: `${bandId}-empty`,
        bandId,
        rect: { ...baseRect, y: cursorY },
        zIndex,
        kind: 'static',
        scope,
      });
      cursorY += baseRect.height;
      return;
    }

    layers.push({
      key: bandId,
      bandId,
      rect: { ...baseRect, y: cursorY },
      zIndex,
      kind: 'static',
      scope,
    });
    cursorY += baseRect.height;
  });

  return layers;
}

/** Monta camadas do preview respeitando bandRect e expansão de dados */
export function buildPreviewLayers(
  page: ReportPage,
  bands: Record<string, ReportBand>,
  data: ReportData,
  context?: OutputPageContext
): PreviewLayer[] {
  const layers: PreviewLayer[] = [];
  const orderedIds = getAllPlacedBandIds(page, bands);

  orderedIds.forEach((bandId, orderIndex) => {
    const band = bands[bandId];
    if (!band) return;

    const scope = getBandOutputScope(band.type);
    if (context && !shouldIncludeBandForOutputPage(scope, context)) {
      return;
    }

    const baseRect = getBandRect(band, page);
    const zIndex = orderIndex + 1;

    if (band.type === 'divider') {
      layers.push({
        key: bandId,
        bandId,
        rect: baseRect,
        zIndex,
        kind: 'divider',
        scope,
      });
      return;
    }

    if (isDataBand(band.type) && band.dataSource && data[band.dataSource]?.length) {
      const rows = data[band.dataSource] as Record<string, unknown>[];

      if (isTableDataBand(band)) {
        const tableHeight = Math.max(
          baseRect.height,
          estimateTableHeight(band, rows.length)
        );
        layers.push({
          key: bandId,
          bandId,
          rect: { ...baseRect, height: tableHeight },
          zIndex,
          kind: 'data-table',
          scope,
        });
        return;
      }

      rows.forEach((row, index) => {
        layers.push({
          key: `${bandId}-${index}`,
          bandId,
          rect: {
            ...baseRect,
            y: baseRect.y + index * baseRect.height,
          },
          zIndex,
          kind: 'data-row',
          rowIndex: index,
          row,
          scope,
        });
      });
      return;
    }

    if (isDataBand(band.type) && band.dataSource && !data[band.dataSource]?.length) {
      layers.push({
        key: `${bandId}-empty`,
        bandId,
        rect: baseRect,
        zIndex,
        kind: 'static',
        scope,
      });
      return;
    }

    layers.push({
      key: bandId,
      bandId,
      rect: baseRect,
      zIndex,
      kind: 'static',
      scope,
    });
  });

  return layers;
}

export type { BandOutputScope, OutputPageContext };

/** Altura útil da folha após posicionar todas as camadas */
export function computeSheetContentHeight(
  page: ReportPage,
  layers: PreviewLayer[]
): number {
  const { height: minHeight } = getPageContentSize(page);
  const profile = page.profile ?? 'document';

  if (profile === 'document' || profile === 'label' || profile === 'label-sheet') {
    return minHeight;
  }

  if (layers.length === 0) return minHeight;

  const maxBottom = layers.reduce(
    (max, layer) => Math.max(max, layer.rect.y + layer.rect.height),
    0
  );

  return Math.max(minHeight, Math.ceil(maxBottom) + 8);
}

export interface PreviewSheetMetrics {
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  contentHeight: number;
  layers: PreviewLayer[];
}

export function buildPreviewSheet(
  page: ReportPage,
  bands: Record<string, ReportBand>,
  data: ReportData
): PreviewSheetMetrics {
  const profile = page.profile ?? 'document';
  const layers =
    profile === 'continuous'
      ? buildContinuousPreviewLayers(page, bands, data)
      : buildPreviewLayers(page, bands, data);
  const { width: contentWidth } = getPageContentSize(page);
  const contentHeight = computeSheetContentHeight(page, layers);

  const pageHeight =
    profile === 'document' || profile === 'label' || profile === 'label-sheet'
      ? page.height
      : Math.max(page.height, contentHeight + page.margins.top + page.margins.bottom);

  return {
    pageWidth: page.width,
    pageHeight,
    contentWidth,
    contentHeight,
    layers,
  };
}
