import { useEffect, useRef, type MutableRefObject } from 'react';
import { useDesignerStore } from '../store/designerStore';
import { getHistoryEntriesToPersist } from '../utils/reportHistoryPersist';

interface UseReportHistoryPersistOptions {
  enabled: boolean;
  intervalMs: number;
  isBlocked: boolean;
  persistedEntryIdsRef: MutableRefObject<Set<string>>;
  onPersist: () => void | Promise<void>;
  isPersistingRef: MutableRefObject<boolean>;
}

/** Envia entradas novas do timeline de alterações ao host no intervalo configurado */
export function useReportHistoryPersist({
  enabled,
  intervalMs,
  isBlocked,
  persistedEntryIdsRef,
  onPersist,
  isPersistingRef,
}: UseReportHistoryPersistOptions) {
  const isBlockedRef = useRef(isBlocked);
  isBlockedRef.current = isBlocked;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const tick = () => {
      if (isBlockedRef.current || isPersistingRef.current) return;

      const { historyPast } = useDesignerStore.getState();
      const pending = getHistoryEntriesToPersist(
        historyPast,
        persistedEntryIdsRef.current
      );
      if (pending.length === 0) return;

      void onPersist();
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, persistedEntryIdsRef, onPersist, isPersistingRef]);
}
