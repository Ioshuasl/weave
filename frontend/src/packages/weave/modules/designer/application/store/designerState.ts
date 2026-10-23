import type { BandsSlice } from './state/bandsSlice.types';
import type { ClipboardSlice } from './state/clipboardSlice.types';
import type { ComponentsSlice } from './state/componentsSlice.types';
import type { DragSlice } from './state/dragSlice.types';
import type { FlashSlice } from './state/flashSlice.types';
import type { HistorySlice } from './state/historySlice.types';
import type { LivePreviewSlice } from './state/livePreviewSlice.types';
import type { PagesSlice } from './state/pagesSlice.types';
import type { PreviewModalSlice } from './state/previewModalSlice.types';
import type { ReportSlice } from './state/reportSlice.types';
import type { SelectionSlice } from './state/selectionSlice.types';
import type { SnapSlice } from './state/snapSlice.types';
import type { TextEditorSlice } from './state/textEditorSlice.types';

/** Estado completo do designer: composição das fatias, cada uma com uma responsabilidade. */
export type DesignerState =
  ReportSlice
  & SelectionSlice
  & PagesSlice
  & BandsSlice
  & ComponentsSlice
  & DragSlice
  & ClipboardSlice
  & HistorySlice
  & SnapSlice
  & TextEditorSlice
  & LivePreviewSlice
  & PreviewModalSlice
  & FlashSlice;

export type { ComponentGroupDrag, BandGroupDrag } from './state/dragSlice.types';
