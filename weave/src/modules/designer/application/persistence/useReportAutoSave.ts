import { useEffect, useRef, type MutableRefObject } from 'react';
import { useDesignerStore } from '../store/designerStore';
import { isReportStateDirty } from '../../../report/domain';

interface UseReportAutoSaveOptions {
  enabled: boolean;
  intervalMs: number;
  isBlocked: boolean;
  lastSavedSnapshotRef: MutableRefObject<string | null>;
  onAutoSave: () => void | Promise<void>;
  isSavingRef: MutableRefObject<boolean>;
}

/** Dispara `onAutoSave` no intervalo configurado quando há alterações não salvas */
export function useReportAutoSave({
  enabled,
  intervalMs,
  isBlocked,
  lastSavedSnapshotRef,
  onAutoSave,
  isSavingRef,
}: UseReportAutoSaveOptions) {
  const isBlockedRef = useRef(isBlocked);
  isBlockedRef.current = isBlocked;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const tick = () => {
      if (isBlockedRef.current || isSavingRef.current) return;

      const { report, data } = useDesignerStore.getState();
      if (!isReportStateDirty(report, data, lastSavedSnapshotRef.current)) return;

      void onAutoSave();
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [
    enabled,
    intervalMs,
    lastSavedSnapshotRef,
    onAutoSave,
    isSavingRef,
  ]);
}
