import { createStore, type StoreApi } from 'zustand';
import { createBandsSlice } from './slices/bandsSlice';
import { createClipboardSlice } from './slices/clipboardSlice';
import { createComponentsSlice } from './slices/componentsSlice';
import { createDragSlice } from './slices/dragSlice';
import { createFlashSlice } from './slices/flashSlice';
import { createHistorySlice } from './slices/historySlice';
import { createLivePreviewSlice } from './slices/livePreviewSlice';
import { createPagesSlice } from './slices/pagesSlice';
import { createPreviewModalSlice } from './slices/previewModalSlice';
import { createReportSlice } from './slices/reportSlice';
import { createSelectionSlice } from './slices/selectionSlice';
import { createSnapSlice } from './slices/snapSlice';
import { createTextEditorSlice } from './slices/textEditorSlice';
import type { DesignerState } from './designerState';

export type DesignerStoreApi = StoreApi<DesignerState>;

/** Cria um store isolado; cada instância de `<Weave />` possui o seu. */
export function createDesignerStore(): DesignerStoreApi {
  return createStore<DesignerState>()((...args) => ({
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
    ...createFlashSlice(...args),
  }));
}
