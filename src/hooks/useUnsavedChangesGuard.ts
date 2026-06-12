import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useDesignerStore } from '../store/designerStore';
import { isReportStateDirty } from '../utils/reportSaveSnapshot';

const HISTORY_GUARD_KEY = 'reportDesignerUnsavedGuard';

interface UseUnsavedChangesGuardOptions {
  /** Ativo no modo design quando há `onClose` */
  enabled: boolean;
  lastSavedSnapshotRef: RefObject<string | null>;
  onClose?: () => void;
  onSave?: () => void | Promise<void>;
}

function isGuardHistoryState(state: unknown): boolean {
  return Boolean(
    state && typeof state === 'object' && HISTORY_GUARD_KEY in (state as object)
  );
}

export function useUnsavedChangesGuard({
  enabled,
  lastSavedSnapshotRef,
  onClose,
  onSave,
}: UseUnsavedChangesGuardOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExitSaving, setIsExitSaving] = useState(false);
  const guardPushedRef = useRef(false);
  /** Evita que `history.back()` programático dispare o handler de saída */
  const ignorePopStateRef = useRef(false);

  const checkDirty = useCallback(() => {
    const { report, data } = useDesignerStore.getState();
    return isReportStateDirty(report, data, lastSavedSnapshotRef.current);
  }, [lastSavedSnapshotRef]);

  const exitDesigner = useCallback(() => {
    if (!onClose) return;

    if (guardPushedRef.current) {
      ignorePopStateRef.current = true;
      guardPushedRef.current = false;
      history.back();
      ignorePopStateRef.current = false;
    }

    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (!onClose) return;
    if (!checkDirty()) {
      exitDesigner();
      return;
    }
    setIsModalOpen(true);
  }, [checkDirty, exitDesigner, onClose]);

  const handleCancel = useCallback(() => {
    if (isExitSaving) return;
    setIsModalOpen(false);
  }, [isExitSaving]);

  const handleDiscard = useCallback(() => {
    if (!onClose || isExitSaving) return;
    setIsModalOpen(false);
    exitDesigner();
  }, [exitDesigner, isExitSaving, onClose]);

  const handleSaveAndExit = useCallback(async () => {
    if (!onClose || !onSave || isExitSaving) return;

    setIsExitSaving(true);
    try {
      await onSave();
      setIsModalOpen(false);
      exitDesigner();
    } finally {
      setIsExitSaving(false);
    }
  }, [exitDesigner, isExitSaving, onClose, onSave]);

  useEffect(() => {
    if (!enabled || !onClose) return;

    const state = { [HISTORY_GUARD_KEY]: true };

    // Strict Mode remonta sem desfazer o push — não empilhar entradas duplicadas
    if (!isGuardHistoryState(history.state)) {
      history.pushState(state, '');
    }
    guardPushedRef.current = true;

    const onPopState = () => {
      if (ignorePopStateRef.current) return;

      if (!checkDirty()) {
        guardPushedRef.current = false;
        onClose();
        return;
      }

      history.pushState(state, '');
      setIsModalOpen(true);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      // Não chamar history.back() no cleanup: no Strict Mode isso dispara popstate
      // no remount e fecha o designer imediatamente (falso positivo de "sair").
    };
  }, [checkDirty, enabled, onClose]);

  return {
    isModalOpen,
    isExitSaving,
    requestClose,
    handleCancel,
    handleDiscard,
    handleSaveAndExit,
  };
}
