import { useCallback } from 'react';
import { useDesignerStore } from '../../application/store/designerStore';
import {
  collectBandSnapTargets,
  collectComponentSnapTargets,
  computeSnap,
  offsetSnapGuides,
  type SnapRect,
  type SnapResult,
} from '../../domain/designerSnap';
import { getBandRect } from '../../../band/domain';
import { getReportPage } from '../../../report/domain';

export function useDesignerSnap() {
  const snapEnabled = useDesignerStore((state) => state.snapEnabled);
  const setActiveSnapGuides = useDesignerStore((state) => state.setActiveSnapGuides);
  const clearSnapGuides = useDesignerStore((state) => state.clearSnapGuides);

  const snapBandRect = useCallback(
    (rect: SnapRect, excludeBandId: string, shiftKey = false): SnapResult => {
      const state = useDesignerStore.getState();
      const page = getReportPage(state.report, state.activePageId);
      if (!page) {
        return { x: rect.x, y: rect.y, guides: { vertical: [], horizontal: [] } };
      }
      const targets = collectBandSnapTargets(state.report, page, excludeBandId);
      const result = computeSnap(rect, targets.vertical, targets.horizontal, {
        enabled: snapEnabled,
        shiftKey,
      });
      setActiveSnapGuides(result.guides);
      return result;
    },
    [snapEnabled, setActiveSnapGuides]
  );

  const snapComponentRect = useCallback(
    (
      rect: SnapRect,
      bandId: string,
      excludeComponentId: string,
      shiftKey = false
    ): SnapResult => {
      const state = useDesignerStore.getState();
      const page = getReportPage(state.report, state.activePageId);
      if (!page) {
        return { x: rect.x, y: rect.y, guides: { vertical: [], horizontal: [] } };
      }
      const targets = collectComponentSnapTargets(
        state.report,
        page,
        bandId,
        excludeComponentId
      );
      const result = computeSnap(rect, targets.vertical, targets.horizontal, {
        enabled: snapEnabled,
        shiftKey,
      });
      const band = state.report.bands[bandId];
      const bandRect = band ? getBandRect(band, page) : { x: 0, y: 0 };
      const pageGuides = offsetSnapGuides(result.guides, bandRect.x, bandRect.y);
      setActiveSnapGuides(pageGuides);
      return result;
    },
    [snapEnabled, setActiveSnapGuides]
  );

  return {
    snapEnabled,
    snapBandRect,
    snapComponentRect,
    clearSnapGuides,
  };
}
