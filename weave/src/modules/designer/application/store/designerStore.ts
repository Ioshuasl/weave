import { create } from 'zustand';
import type { DesignerState } from './designerState';
import { createReportSlice } from './slices/reportSlice';
import { createSelectionSlice } from './slices/selectionSlice';
import { createPagesSlice } from './slices/pagesSlice';
import { createBandsSlice } from './slices/bandsSlice';
import { createComponentsSlice } from './slices/componentsSlice';
import { createDragSlice } from './slices/dragSlice';
import { createClipboardSlice } from './slices/clipboardSlice';
import { createHistorySlice } from './slices/historySlice';
import { createSnapSlice } from './slices/snapSlice';
import { createTextEditorSlice } from './slices/textEditorSlice';
import { createLivePreviewSlice } from './slices/livePreviewSlice';
import { createPreviewModalSlice } from './slices/previewModalSlice';

export const useDesignerStore = create<DesignerState>()((...args) => ({
  ...createReportSlice(...args),
  ...createSelectionSlice(...args),
  ...createPagesSlice(...args),
  ...createBandsSlice(...args),
  ...createComponentsSlice(...args),
  ...createDragSlice(...args),
  ...createClipboardSlice(...args),
  ...createHistorySlice(...args),
  ...createSnapSlice(...args),
  ...createTextEditorSlice(...args),
  ...createLivePreviewSlice(...args),
  ...createPreviewModalSlice(...args),
}));
