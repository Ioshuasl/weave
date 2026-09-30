import { type SelectionMode } from '../../../domain/selectionUtils';

export interface SelectionSlice {
  selectedIds: string[];
  /** Folha selecionada via clique em área vazia do canvas (Fase 3.0) */
  selectedPageId: string | null;
  /** Alvo de hover no canvas (hit-test; não vai para o histórico) */
  canvasHoverId: string | null;

  // Actions
  setSelection: (
    id: string | null,
    options?: { mode?: SelectionMode; bringToFront?: boolean }
  ) => void;
  clearSelection: () => void;
  setCanvasHoverId: (id: string | null) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
}
