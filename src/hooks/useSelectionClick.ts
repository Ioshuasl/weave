import { useCallback } from 'react';
import { useDesignerStore } from '../store/designerStore';
import type { SelectionMode } from '../utils/selectionUtils';

function resolveSelectionMode(event: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }): SelectionMode {
  if (event.ctrlKey || event.metaKey) return 'toggle';
  if (event.shiftKey) return 'add';
  return 'replace';
}

/** Clique com suporte a seleção múltipla (Ctrl/Cmd+clique, Shift+clique) */
export function useSelectionClick() {
  const setSelection = useDesignerStore((state) => state.setSelection);

  return useCallback(
    (id: string, event?: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => {
      const mode = event ? resolveSelectionMode(event) : 'replace';
      setSelection(id, { mode });
    },
    [setSelection]
  );
}
