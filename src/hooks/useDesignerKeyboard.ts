import { useEffect } from 'react';
import { useDesignerStore } from '../store/designerStore';
import { getSelectedComponentIds } from '../utils/selectionUtils';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('.rich-text-editor'));
}

interface DesignerKeyboardOptions {
  onOpenHistory?: () => void;
  onSave?: () => void;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
}

/** Atalhos globais do designer: Delete, undo/redo e histórico. */
export function useDesignerKeyboardShortcuts(
  disabled = false,
  options?: DesignerKeyboardOptions
) {
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const reportComponents = useDesignerStore((state) => state.report.components);
  const removeSelected = useDesignerStore((state) => state.removeSelected);
  const duplicateSelected = useDesignerStore((state) => state.duplicateSelected);
  const copySelected = useDesignerStore((state) => state.copySelected);
  const pasteToTargetBand = useDesignerStore((state) => state.pasteToTargetBand);
  const undo = useDesignerStore((state) => state.undo);
  const redo = useDesignerStore((state) => state.redo);
  const openTextEditorModal = useDesignerStore((state) => state.openTextEditorModal);
  const historyPointer = useDesignerStore((state) => state.historyPointer);
  const historyLength = useDesignerStore((state) => state.historyPast.length);

  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const targetEditable = isEditableTarget(e.target);
      const hasSelection = selectedIds.length > 0;
      const hasComponentSelection = getSelectedComponentIds(
        selectedIds,
        useDesignerStore.getState().report
      ).length > 0;

      if (mod && e.key.toLowerCase() === 's') {
        if (targetEditable) return;
        if (!options?.onSave) return;

        e.preventDefault();
        options.onSave();
        return;
      }

      if (mod && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        options?.onOpenHistory?.();
        return;
      }

      if (!mod && !e.altKey && e.key === '[') {
        if (targetEditable) return;
        if (!options?.onToggleLeftPanel) return;
        e.preventDefault();
        options.onToggleLeftPanel();
        return;
      }

      if (!mod && !e.altKey && e.key === ']') {
        if (targetEditable) return;
        if (!options?.onToggleRightPanel) return;
        e.preventDefault();
        options.onToggleRightPanel();
        return;
      }

      if (e.key === 'F2') {
        if (targetEditable) return;
        const componentIds = getSelectedComponentIds(
          selectedIds,
          useDesignerStore.getState().report
        );
        if (componentIds.length !== 1) return;
        const component = useDesignerStore.getState().report.components[componentIds[0]];
        if (component?.type !== 'text') return;

        e.preventDefault();
        openTextEditorModal(componentIds[0]);
        return;
      }

      if (mod && e.key.toLowerCase() === 'c') {
        if (targetEditable) return;
        if (!hasComponentSelection) return;

        e.preventDefault();
        copySelected();
        return;
      }

      if (mod && e.key.toLowerCase() === 'v') {
        if (targetEditable) return;

        e.preventDefault();
        pasteToTargetBand();
        return;
      }

      if (mod && e.key.toLowerCase() === 'd') {
        if (targetEditable) return;
        if (!hasSelection) return;

        e.preventDefault();
        duplicateSelected();
        return;
      }

      if (mod && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
        if (targetEditable) return;

        const isRedo = e.key.toLowerCase() === 'y' || e.shiftKey;
        e.preventDefault();

        if (isRedo) {
          if (historyPointer < historyLength - 1) redo();
        } else if (historyPointer > 0) {
          undo();
        }
        return;
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (!hasSelection) return;
      if (targetEditable) return;
      if (mod || e.altKey) return;

      const hasKnownSelection = selectedIds.some(
        (id) => reportComponents[id] || useDesignerStore.getState().report.bands[id]
      );
      if (!hasKnownSelection) return;

      e.preventDefault();
      removeSelected();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    disabled,
    selectedIds,
    reportComponents,
    removeSelected,
    duplicateSelected,
    copySelected,
    pasteToTargetBand,
    undo,
    redo,
    openTextEditorModal,
    historyPointer,
    historyLength,
    options?.onOpenHistory,
    options?.onSave,
    options?.onToggleLeftPanel,
    options?.onToggleRightPanel,
  ]);
}
