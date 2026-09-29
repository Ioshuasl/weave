import { useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { useDesignerStore } from '../../application/store/designerStore';
import { clientToPageContentPoint } from './designerDragDrop';
import { collectCanvasHits, pickCanvasHit } from './canvasHitTest';
import { getReportPage } from '../../../report/domain';

/** Hover no canvas via hit-test geométrico (não altera pointer-events). */
export function useCanvasHoverHitTest(zoom: number) {
  const setCanvasHoverId = useDesignerStore((state) => state.setCanvasHoverId);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const state = useDesignerStore.getState();
      if (
        event.buttons !== 0 ||
        state.draggingComponentId ||
        state.componentGroupDrag ||
        state.bandGroupDrag
      ) {
        return;
      }
      const point = clientToPageContentPoint(event.clientX, event.clientY, zoom);
      if (!point) {
        setCanvasHoverId(null);
        return;
      }
      const page = getReportPage(state.report, state.activePageId);
      if (!page) {
        setCanvasHoverId(null);
        return;
      }
      const pick = pickCanvasHit(
        collectCanvasHits(state.report, page, point.x, point.y, state.dragPreviewRects)
      );
      setCanvasHoverId(pick?.id ?? null);
    },
    [zoom, setCanvasHoverId]
  );

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      if (useDesignerStore.getState().draggingComponentId) return;
      setCanvasHoverId(null);
    },
    [setCanvasHoverId]
  );

  return {
    handlePointerMove,
    handlePointerLeave,
  };
}
