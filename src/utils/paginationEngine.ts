import type { ReportBand, ReportData, ReportDefinition, ReportPage } from '../types/report';
import {
  getBandOutputScope,
  resolvePageLayoutZones,
  tagLayerScope,
  type OutputPageContext,
  type PageLayoutZones,
} from './bandScopeUtils';
import {
  getAllPlacedBandIds,
  getBandRect,
  getPageContentSize,
} from './reportPageUtils';
import { isDataBand, isTableDataBand } from './dataBandUtils';
import {
  buildContinuousPreviewLayers,
  computeSheetContentHeight,
  type PreviewLayer,
} from './previewLayout';

const TABLE_HEADER_HEIGHT = 34;
const TABLE_ROW_HEIGHT = 30;

export interface PaginatedOutputPage {
  pageNumber: number;
  totalPages: number;
  context: OutputPageContext;
  layers: PreviewLayer[];
}

interface PackableBlock {
  height: number;
  layers: PreviewLayer[];
  flow?: boolean;
}

function buildStaticLayer(
  bandId: string,
  band: ReportBand,
  page: ReportPage,
  orderIndex: number,
  keySuffix = ''
): PreviewLayer {
  return tagLayerScope(
    {
      key: `${bandId}${keySuffix}`,
      bandId,
      rect: getBandRect(band, page),
      zIndex: orderIndex + 1,
      kind: band.type === 'divider' ? 'divider' : 'static',
    },
    { [bandId]: band }
  );
}

function buildDataRowFlowBlocks(
  bandId: string,
  band: ReportBand,
  page: ReportPage,
  data: ReportData,
  orderIndex: number
): PackableBlock[] {
  const baseRect = getBandRect(band, page);
  const scope = getBandOutputScope(band.type);
  const rows = band.dataSource
    ? ((data[band.dataSource] as Record<string, unknown>[]) ?? [])
    : [];

  if (isTableDataBand(band)) {
    const rowCount = rows.length;
    const tableHeight = Math.max(
      baseRect.height,
      (band.dataTable?.showHeader !== false ? TABLE_HEADER_HEIGHT : 0) +
        rowCount * TABLE_ROW_HEIGHT +
        2
    );
    return [
      {
        height: tableHeight,
        flow: true,
        layers: [
          tagLayerScope(
            {
              key: bandId,
              bandId,
              rect: { ...baseRect, height: tableHeight, y: 0 },
              zIndex: orderIndex + 1,
              kind: 'data-table',
            },
            { [bandId]: band }
          ),
        ],
      },
    ];
  }

  if (rows.length === 0) {
    return [
      {
        height: baseRect.height,
        flow: true,
        layers: [
          tagLayerScope(
            {
              key: `${bandId}-empty`,
              bandId,
              rect: { ...baseRect, y: 0 },
              zIndex: orderIndex + 1,
              kind: 'static',
            },
            { [bandId]: band }
          ),
        ],
      },
    ];
  }

  return rows.map((row, index) => ({
    height: baseRect.height,
    flow: true,
    layers: [
      tagLayerScope(
        {
          key: `${bandId}-${index}`,
          bandId,
          rect: { ...baseRect, y: 0 },
          zIndex: orderIndex + 1,
          kind: 'data-row' as const,
          rowIndex: index,
          row,
          scope,
        },
        { [bandId]: band }
      ),
    ],
  }));
}

function packFlowBlocks(
  blocks: PackableBlock[],
  pageBodyCapacity: number
): PackableBlock[][] {
  if (blocks.length === 0) return [[]];

  const pages: PackableBlock[][] = [[]];
  let usedHeight = 0;

  for (const block of blocks) {
    if (usedHeight > 0 && usedHeight + block.height > pageBodyCapacity) {
      pages.push([block]);
      usedHeight = block.height;
    } else {
      pages[pages.length - 1].push(block);
      usedHeight += block.height;
    }
  }

  return pages;
}

function buildOutputPageContext(
  pageNumber: number,
  totalPages: number,
  zones: PageLayoutZones
): OutputPageContext {
  return {
    outputPageNumber: pageNumber,
    outputTotalPages: totalPages,
    isFirstOutputPage: pageNumber === 1,
    isLastOutputPage: pageNumber === totalPages,
    zones,
  };
}

function positionFlowLayers(
  blocks: PackableBlock[],
  startY: number
): { layers: PreviewLayer[]; cursorY: number } {
  let cursorY = startY;
  const layers = blocks.flatMap((block) =>
    block.layers.map((layer) => {
      const next = {
        ...layer,
        rect: { ...layer.rect, y: cursorY },
      };
      cursorY += layer.rect.height;
      return next;
    })
  );
  return { layers, cursorY };
}

function positionOnceLastLayers(
  layers: PreviewLayer[],
  startY: number,
  bodyBottom: number
): { layers: PreviewLayer[]; needsOverflowPage: boolean } {
  let cursorY = startY;

  const positioned = layers.map((layer) => {
    const next = {
      ...layer,
      rect: { ...layer.rect, y: cursorY },
    };
    cursorY += layer.rect.height;
    return next;
  });

  return {
    layers: positioned,
    needsOverflowPage: cursorY > bodyBottom,
  };
}

function buildLayersForOutputPage(
  everyPageLayers: PreviewLayer[],
  onceLayers: PreviewLayer[],
  flowBlocks: PackableBlock[],
  onceLastLayers: PreviewLayer[],
  zones: PageLayoutZones,
  options: {
    isFirst: boolean;
    isLast: boolean;
    flowStartY: number;
  }
): { layers: PreviewLayer[]; cursorYAfterFlow: number; onceLastNeedsPage: boolean } {
  const { isFirst, isLast, flowStartY } = options;
  const startY = isFirst ? flowStartY : zones.bodyTop;

  const { layers: bodyLayers, cursorY } = positionFlowLayers(flowBlocks, startY);

  let onceLastNeedsPage = false;
  let summaryLayers: PreviewLayer[] = [];

  if (isLast && onceLastLayers.length > 0) {
    const summaryStartY = Math.max(cursorY, zones.bodyTop);
    const result = positionOnceLastLayers(onceLastLayers, summaryStartY, zones.bodyBottom);
    summaryLayers = result.layers;
    onceLastNeedsPage = result.needsOverflowPage;
  }

  const layers = [
    ...everyPageLayers,
    ...(isFirst ? onceLayers : []),
    ...bodyLayers,
    ...summaryLayers,
  ];

  return { layers, cursorYAfterFlow: cursorY, onceLastNeedsPage };
}

/**
 * Pagina uma ReportPage de design em folhas de saída (Fase 3.2 + 3.3).
 * Escopos: once (título), everyPage (header/footer), flow (dados), onceLast (resumo).
 */
export function paginateReportPage(
  page: ReportPage,
  bands: Record<string, ReportBand>,
  data: ReportData
): PaginatedOutputPage[] {
  const profile = page.profile ?? 'document';
  if (profile !== 'document' && profile !== 'label' && profile !== 'label-sheet') {
    const { height: contentHeight } = getPageContentSize(page);
    const zones: PageLayoutZones = {
      contentHeight,
      headerBottom: 0,
      footerTop: contentHeight,
      bodyTop: 0,
      bodyBottom: contentHeight,
    };
    const layers = buildContinuousPreviewLayers(page, bands, data);
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        context: buildOutputPageContext(1, 1, zones),
        layers,
      },
    ];
  }

  const { height: contentHeight } = getPageContentSize(page);
  const orderedIds = getAllPlacedBandIds(page, bands);

  const everyPageLayers: PreviewLayer[] = [];
  const onceLayers: PreviewLayer[] = [];
  const onceLastLayers: PreviewLayer[] = [];
  const flowBlocks: PackableBlock[] = [];
  let flowDesignStartY: number | null = null;

  orderedIds.forEach((bandId, orderIndex) => {
    const band = bands[bandId];
    if (!band) return;

    const scope = getBandOutputScope(band.type);

    if (scope === 'everyPage') {
      everyPageLayers.push(buildStaticLayer(bandId, band, page, orderIndex));
      return;
    }

    if (scope === 'onceLast') {
      onceLastLayers.push(buildStaticLayer(bandId, band, page, orderIndex));
      return;
    }

    if (scope === 'flow') {
      if (flowDesignStartY === null) {
        flowDesignStartY = getBandRect(band, page).y;
      }
      flowBlocks.push(...buildDataRowFlowBlocks(bandId, band, page, data, orderIndex));
      return;
    }

    onceLayers.push(buildStaticLayer(bandId, band, page, orderIndex));
  });

  const zones = resolvePageLayoutZones(page, bands, everyPageLayers, contentHeight);

  const firstPageFlowStart = Math.max(zones.bodyTop, flowDesignStartY ?? zones.bodyTop);
  const firstPageFlowCapacity = Math.max(40, zones.bodyBottom - firstPageFlowStart);
  const continuationFlowCapacity = Math.max(40, zones.bodyBottom - zones.bodyTop);

  if (flowBlocks.length === 0) {
    const context = buildOutputPageContext(1, 1, zones);
    const layers = [...everyPageLayers, ...onceLayers, ...onceLastLayers];
    return [{ pageNumber: 1, totalPages: 1, context, layers }];
  }

  const pageBlockGroups: PackableBlock[][] = [];
  let remaining = [...flowBlocks];

  if (remaining.length > 0) {
    const firstChunk: PackableBlock[] = [];
    let used = 0;

    for (let i = 0; i < remaining.length; i++) {
      const block = remaining[i];
      if (used > 0 && used + block.height > firstPageFlowCapacity) break;
      firstChunk.push(block);
      used += block.height;
    }

    pageBlockGroups.push(firstChunk);
    remaining = remaining.slice(firstChunk.length);
  }

  while (remaining.length > 0) {
    const packed = packFlowBlocks(remaining, continuationFlowCapacity);
    pageBlockGroups.push(...packed);
    break;
  }

  let totalPages = pageBlockGroups.length;
  const draftPages: Array<{
    flowBlocks: PackableBlock[];
    isFirst: boolean;
    isLast: boolean;
    onceLastNeedsPage: boolean;
    layers: PreviewLayer[];
  }> = [];

  pageBlockGroups.forEach((group, index) => {
    const isFirst = index === 0;
    const isLast = index === totalPages - 1;
    const built = buildLayersForOutputPage(
      everyPageLayers,
      onceLayers,
      group,
      onceLastLayers,
      zones,
      { isFirst, isLast, flowStartY: firstPageFlowStart }
    );

    draftPages.push({
      flowBlocks: group,
      isFirst,
      isLast,
      onceLastNeedsPage: built.onceLastNeedsPage,
      layers: built.layers,
    });
  });

  const lastDraft = draftPages[draftPages.length - 1];
  if (lastDraft?.onceLastNeedsPage && onceLastLayers.length > 0) {
    totalPages += 1;
    draftPages[draftPages.length - 1] = {
      ...lastDraft,
      isLast: false,
      onceLastNeedsPage: false,
      layers: buildLayersForOutputPage(
        everyPageLayers,
        onceLayers,
        lastDraft.flowBlocks,
        [],
        zones,
        { isFirst: lastDraft.isFirst, isLast: false, flowStartY: firstPageFlowStart }
      ).layers,
    };

    const summaryOnly = positionOnceLastLayers(onceLastLayers, zones.bodyTop, zones.bodyBottom);

    draftPages.push({
      flowBlocks: [],
      isFirst: false,
      isLast: true,
      onceLastNeedsPage: false,
      layers: [...everyPageLayers, ...summaryOnly.layers],
    });
  }

  return draftPages.map((draft, index) => ({
    pageNumber: index + 1,
    totalPages: draftPages.length,
    context: buildOutputPageContext(index + 1, draftPages.length, zones),
    layers: draft.layers,
  }));
}

export interface ReportPreviewSheet {
  designPageId: string;
  designPageName: string;
  outputPageNumber: number;
  outputTotalPages: number;
  globalPageNumber: number;
  globalTotalPages: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  contentHeight: number;
  context: OutputPageContext;
  layers: PreviewLayer[];
}

export function buildReportPreviewSheets(
  report: ReportDefinition,
  data: ReportData
): ReportPreviewSheet[] {
  const sheets: ReportPreviewSheet[] = [];
  const allOutputs: Array<PaginatedOutputPage & { designPage: ReportPage }> = [];

  for (const designPage of report.pages) {
    const outputs = paginateReportPage(designPage, report.bands, data);
    for (const output of outputs) {
      allOutputs.push({ ...output, designPage });
    }
  }

  const globalTotal = allOutputs.length;

  allOutputs.forEach((item, index) => {
    const { width: contentWidth } = getPageContentSize(item.designPage);
    const profile = item.designPage.profile ?? 'document';
    const isContinuous = profile === 'continuous';

    const contentHeight = isContinuous
      ? computeSheetContentHeight(item.designPage, item.layers)
      : getPageContentSize(item.designPage).height;

    const pageHeight = isContinuous
      ? Math.max(
          item.designPage.height,
          contentHeight + item.designPage.margins.top + item.designPage.margins.bottom
        )
      : item.designPage.height;

    sheets.push({
      designPageId: item.designPage.id,
      designPageName: item.designPage.name,
      outputPageNumber: item.pageNumber,
      outputTotalPages: item.totalPages,
      globalPageNumber: index + 1,
      globalTotalPages: globalTotal,
      pageWidth: item.designPage.width,
      pageHeight,
      contentWidth,
      contentHeight,
      context: item.context,
      layers: item.layers,
    });
  });

  return sheets;
}
