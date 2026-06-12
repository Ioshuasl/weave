import type { BandType, ReportBand, ReportPage } from '../types/report';
import type { PreviewLayer } from './previewLayout';
import { getBandRect } from './reportPageUtils';

/**
 * Escopo de renderização de bandas em folhas de saída (Fase 3.2).
 * - once: só na primeira folha de saída (ex.: reportTitle)
 * - onceLast: só na última folha de saída, após o corpo (ex.: reportSummary)
 * - everyPage: repetir em todas as folhas nas faixas fixas (pageHeader/pageFooter)
 * - flow: corpo expansível — driver de quebras de página
 */
export type BandOutputScope = 'once' | 'onceLast' | 'everyPage' | 'flow';

export interface PageLayoutZones {
  contentHeight: number;
  headerBottom: number;
  footerTop: number;
  bodyTop: number;
  bodyBottom: number;
}

export interface OutputPageContext {
  outputPageNumber: number;
  outputTotalPages: number;
  isFirstOutputPage: boolean;
  isLastOutputPage: boolean;
  zones: PageLayoutZones;
}

export function getBandOutputScope(type: BandType): BandOutputScope {
  switch (type) {
    case 'reportTitle':
      return 'once';
    case 'reportSummary':
      return 'onceLast';
    case 'pageHeader':
    case 'pageFooter':
      return 'everyPage';
    case 'dataList':
    case 'dataListNumbered':
    case 'dataTable':
    case 'masterData':
    case 'detailData':
      return 'flow';
    default:
      return 'once';
  }
}

export function isFlowDataBandType(type: BandType): boolean {
  return getBandOutputScope(type) === 'flow';
}

export function isEveryPageBandType(type: BandType): boolean {
  return getBandOutputScope(type) === 'everyPage';
}

export function resolvePageLayoutZones(
  page: ReportPage,
  bands: Record<string, ReportBand>,
  everyPageLayers: PreviewLayer[],
  contentHeight: number
): PageLayoutZones {
  const headerBottom = everyPageLayers
    .filter((layer) => bands[layer.bandId]?.type === 'pageHeader')
    .reduce((max, layer) => Math.max(max, layer.rect.y + layer.rect.height), 0);

  const footerTop = everyPageLayers
    .filter((layer) => bands[layer.bandId]?.type === 'pageFooter')
    .reduce((min, layer) => Math.min(min, layer.rect.y), contentHeight);

  const bodyTop = headerBottom;
  const bodyBottom = footerTop > bodyTop ? footerTop : contentHeight;

  return {
    contentHeight,
    headerBottom,
    footerTop,
    bodyTop,
    bodyBottom,
  };
}

export function tagLayerScope(
  layer: PreviewLayer,
  bands: Record<string, ReportBand>
): PreviewLayer {
  const band = bands[layer.bandId];
  if (!band) return layer;
  return { ...layer, scope: getBandOutputScope(band.type) };
}

export function getBandDesignHeight(band: ReportBand, page: ReportPage): number {
  return getBandRect(band, page).height;
}
