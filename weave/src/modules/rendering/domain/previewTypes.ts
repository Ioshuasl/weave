import type { Rect } from '../../../shared/domain/geometry';
import type { BandOutputScope } from '../../band/domain';

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
