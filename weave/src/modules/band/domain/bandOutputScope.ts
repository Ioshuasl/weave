import type { BandType, ReportBand } from './band';
import type { ReportPage } from '../../page/domain';
import { getBandRect } from './bandPlacement';

/**
 * Escopo de renderização de bandas em folhas de saída (Fase 3.2).
 * - once: só na primeira folha de saída (ex.: reportTitle)
 * - onceLast: só na última folha de saída, após o corpo (ex.: reportSummary)
 * - everyPage: repetir em todas as folhas nas faixas fixas (pageHeader/pageFooter)
 * - flow: corpo expansível — driver de quebras de página
 */
export type BandOutputScope = 'once' | 'onceLast' | 'everyPage' | 'flow';

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

export function getBandDesignHeight(band: ReportBand, page: ReportPage): number {
  return getBandRect(band, page).height;
}
