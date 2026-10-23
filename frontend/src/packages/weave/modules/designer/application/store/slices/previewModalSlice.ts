import type { DesignerState } from '../designerState';
import type { PreviewModalSlice } from '../state/previewModalSlice.types';
import type { StateCreator } from 'zustand';

export const createPreviewModalSlice: StateCreator<DesignerState, [], [], PreviewModalSlice> = (set) => ({
  previewModalOpen: false,
  calculosPanelOpen: false,

  setPreviewModalOpen: (open) =>
    set((state) => {
      if (state.previewModalOpen === open) return state;
      return { previewModalOpen: open };
    }),

  setCalculosPanelOpen: (open) =>
    set((state) => {
      if (state.calculosPanelOpen === open) return state;
      return { calculosPanelOpen: open };
    }),
});
