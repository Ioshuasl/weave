import type { StateCreator } from 'zustand';
import type { DesignerState } from '../designerState';
import type { PreviewModalSlice } from '../state/previewModalSlice.types';

export const createPreviewModalSlice: StateCreator<DesignerState, [], [], PreviewModalSlice> = (set) => ({
  previewModalOpen: false,

  setPreviewModalOpen: (open) =>
    set((state) => {
      if (state.previewModalOpen === open) return state;
      return { previewModalOpen: open };
    }),
});
