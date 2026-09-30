import { type HistoryEntry } from '../../../../history/domain';

export interface HistorySlice {
  historyPast: HistoryEntry[];
  historyPointer: number;

  undo: () => void;
  redo: () => void;
  jumpToHistory: (index: number) => void;
}
