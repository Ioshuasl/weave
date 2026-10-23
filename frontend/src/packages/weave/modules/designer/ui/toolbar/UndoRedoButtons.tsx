import { Redo2, Undo2 } from 'lucide-react';
import React from 'react';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';

const BUTTON_CLASS =
  'inline-flex items-center justify-center w-8 h-8 rounded-md text-neutral-600 transition-colors hover:bg-weave-surface hover:text-neutral-900 disabled:opacity-35 disabled:pointer-events-none';

/** Desfazer / refazer sempre visíveis no cabeçalho (atalhos Ctrl+Z / Ctrl+Shift+Z). */
export function UndoRedoButtons() {
  const undo = useDesignerStore((state) => state.undo);
  const redo = useDesignerStore((state) => state.redo);
  const canUndo = useDesignerStore((state) => state.historyPointer > 0);
  const canRedo = useDesignerStore((state) => state.historyPointer < state.historyPast.length - 1);

  return (
    <div data-tour="undo-redo" className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        title="Desfazer (Ctrl+Z)"
        aria-label="Desfazer"
        className={BUTTON_CLASS}
      >
        <Undo2 className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        title="Refazer (Ctrl+Shift+Z)"
        aria-label="Refazer"
        className={BUTTON_CLASS}
      >
        <Redo2 className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
