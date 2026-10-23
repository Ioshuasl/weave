import { MousePointerClick } from 'lucide-react';
import React from 'react';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import { getPrimarySelectedId } from '../../domain/selectionUtils';
import { useDesignerServices } from '../services/DesignerServicesContext';

export const TEXT_EDIT_HINT_ID = 'text-double-click';

/** Dica de primeiro uso: aparece com um texto selecionado até o primeiro duplo clique. */
export function TextEditHint() {
  const { hints } = useDesignerServices();
  const isSingleTextSelected = useDesignerStore((state) => {
    const id = getPrimarySelectedId(state.selectedIds);
    return (
      state.selectedIds.length === 1 && id !== null && state.report.components[id]?.type === 'text'
    );
  });
  const isTextEditorOpen = useDesignerStore((state) => state.textEditorModal !== null);

  if (!isSingleTextSelected || isTextEditorOpen || hints.hasSeen(TEXT_EDIT_HINT_ID)) return null;

  return (
    <div
      role="status"
      className="pointer-events-none absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-white shadow-md"
    >
      <MousePointerClick className="h-3.5 w-3.5" />
      Clique duas vezes no texto para editar
    </div>
  );
}
