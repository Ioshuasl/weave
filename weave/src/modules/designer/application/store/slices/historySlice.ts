import type { StateCreator } from 'zustand';
import { restoreHistoryEntry } from '../historyRecording';
import { INITIAL_HISTORY_ENTRY } from '../initialState';
import type { DesignerState } from '../designerState';
import type { HistorySlice } from '../state/historySlice.types';

export const createHistorySlice: StateCreator<DesignerState, [], [], HistorySlice> = (set) => ({
  historyPast: [INITIAL_HISTORY_ENTRY],
  historyPointer: 0,

  undo: () =>
    set((state) => {
      if (state.historyPointer <= 0) return state;
      return restoreHistoryEntry(state, state.historyPointer - 1);
    }),

  redo: () =>
    set((state) => {
      if (state.historyPointer >= state.historyPast.length - 1) return state;
      return restoreHistoryEntry(state, state.historyPointer + 1);
    }),

  jumpToHistory: (index) =>
    set((state) => {
      if (index < 0 || index >= state.historyPast.length) return state;
      if (index === state.historyPointer) return state;
      return restoreHistoryEntry(state, index);
    }),
});
