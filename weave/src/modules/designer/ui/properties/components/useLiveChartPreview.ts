import { useCallback, useEffect, useRef } from 'react';
import type { ChartProps } from '../../../../components/common/domain';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';

/**
 * Preview de chartProps no canvas sem gravar histórico a cada frame.
 * Commit explícito via `commitVisualPatch` (blur / pointerup).
 */
export function useLiveChartPreview(componentId: string) {
  const setLiveChartPreview = useDesignerStore((state) => state.setLiveChartPreview);
  const clearLiveChartPreview = useDesignerStore((state) => state.clearLiveChartPreview);
  const rafRef = useRef<number | null>(null);
  const pendingPatchRef = useRef<Partial<ChartProps> | null>(null);

  const cancelScheduledPreview = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingPatchRef.current = null;
  }, []);

  const schedulePreview = useCallback(
    (patch: Partial<ChartProps>) => {
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
      if (rafRef.current != null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pending = pendingPatchRef.current;
        pendingPatchRef.current = null;
        if (pending) {
          setLiveChartPreview({ componentId, chartProps: pending });
        }
      });
    },
    [componentId, setLiveChartPreview]
  );

  const commitVisualPatch = useCallback(
    (patch: Partial<ChartProps>, onCommit: () => void) => {
      cancelScheduledPreview();
      clearLiveChartPreview();
      onCommit();
    },
    [cancelScheduledPreview, clearLiveChartPreview]
  );

  const discardPreview = useCallback(() => {
    cancelScheduledPreview();
    clearLiveChartPreview();
  }, [cancelScheduledPreview, clearLiveChartPreview]);

  useEffect(
    () => () => {
      cancelScheduledPreview();
      clearLiveChartPreview();
    },
    [cancelScheduledPreview, clearLiveChartPreview]
  );

  return { schedulePreview, commitVisualPatch, discardPreview };
}
