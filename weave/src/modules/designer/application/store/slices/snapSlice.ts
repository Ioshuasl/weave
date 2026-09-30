import type { StateCreator } from 'zustand';
import type { DesignerState } from '../designerState';
import type { SnapSlice } from '../state/snapSlice.types';

export const createSnapSlice: StateCreator<DesignerState, [], [], SnapSlice> = (set) => ({
  snapEnabled: true,
  activeSnapGuides: null,

  setSnapEnabled: (enabled) =>
    set((state) => {
      if (state.snapEnabled === enabled) return state;
      return { snapEnabled: enabled };
    }),

  setActiveSnapGuides: (guides) =>
    set((state) => {
      const prev = state.activeSnapGuides;
      const same =
        prev === guides ||
        (prev &&
          guides &&
          prev.vertical.join() === guides.vertical.join() &&
          prev.horizontal.join() === guides.horizontal.join());
      if (same) return state;
      return { activeSnapGuides: guides };
    }),

  clearSnapGuides: () =>
    set((state) => {
      if (state.activeSnapGuides === null) return state;
      return { activeSnapGuides: null };
    }),
});
