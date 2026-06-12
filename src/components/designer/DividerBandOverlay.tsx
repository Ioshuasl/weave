import React, { useRef, useState } from 'react';
import { stylePreviewDebug } from '../../utils/stylePreviewDebug';
import { useDesignerStore } from '../../store/designerStore';
import { cn } from '../../utils/cn';
import { useDesignerZoom } from './designerZoomContext';
import { DividerLine } from './DividerLine';
import { DividerLineEditor } from './DividerLineEditor';
import { resolveDividerLine } from '../../utils/vectorLineUtils';
import { BandToolbar } from './BandToolbar';
import { getBandRect, getBandZIndex, getReportPage } from '../../utils/reportPageUtils';
import { shouldSuppressDesignerCanvasZBoost } from '../../utils/designerZIndex';
import { getBandDisplayLabel } from '../../utils/dataBandUtils';
import {
  attachDocumentPointerDrag,
  isVectorLineHandle,
  screenDeltaToPageDelta,
  translateBandRect,
} from '../../utils/dividerBandInteraction';
import { useDesignerSnap } from '../../hooks/useDesignerSnap';
import { useSelectionClick } from '../../hooks/useSelectionClick';
import { isIdSelected } from '../../utils/selectionUtils';
import { hasExceededScreenDragThreshold } from '../../utils/designerDragThreshold';

interface DividerBandOverlayProps {
  bandId: string;
}

function stopCanvasBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export const DividerBandOverlay = React.memo(function DividerBandOverlay({
  bandId,
}: DividerBandOverlayProps) {
  const band = useDesignerStore((state) => state.report.bands[bandId]);
  const report = useDesignerStore((state) => state.report);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const page = getReportPage(report, activePageId)!;
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const selectItem = useSelectionClick();
  const updateBand = useDesignerStore((state) => state.updateBand);
  const removeBand = useDesignerStore((state) => state.removeBand);
  const duplicateBand = useDesignerStore((state) => state.duplicateBand);
  const bandGroupDrag = useDesignerStore((state) => state.bandGroupDrag);
  const storeBandPreview = useDesignerStore((state) => state.dragPreviewRects?.[bandId]);
  const beginBandGroupDrag = useDesignerStore((state) => state.beginBandGroupDrag);
  const setDragPreviewRects = useDesignerStore((state) => state.setDragPreviewRects);
  const commitBandGroupDrag = useDesignerStore((state) => state.commitBandGroupDrag);
  const cancelBandGroupDrag = useDesignerStore((state) => state.cancelBandGroupDrag);
  const cancelComponentGroupDrag = useDesignerStore((state) => state.cancelComponentGroupDrag);
  const zoom = useDesignerZoom();
  const rootRef = useRef<HTMLDivElement>(null);
  const { snapBandRect, clearSnapGuides } = useDesignerSnap();
  const movedDuringDragRef = useRef(false);
  const dragActivatedRef = useRef(false);
  const previewRectRef = useRef<ReturnType<typeof getBandRect> | null>(null);
  const [previewRect, setPreviewRect] = useState<ReturnType<typeof getBandRect> | null>(null);
  const textEditorModalOpen = useDesignerStore((state) =>
    shouldSuppressDesignerCanvasZBoost(state)
  );

  stylePreviewDebug.countRender(`PlacedBandOverlay:${bandId}`);

  if (!band || band.type !== 'divider') return null;

  const rect = getBandRect(band, page);
  const isSelected = isIdSelected(selectedIds, bandId);
  const isBandGroupFollower =
    bandGroupDrag !== null &&
    bandGroupDrag.leaderId !== bandId &&
    bandGroupDrag.memberIds.includes(bandId);
  const displayRect = storeBandPreview
    ? { ...rect, x: storeBandPreview.x, y: storeBandPreview.y }
    : previewRect ?? rect;
  const zIndex = getBandZIndex(
    bandId,
    page,
    textEditorModalOpen ? null : isSelected ? bandId : null
  );

  const commitBandPosition = (next: typeof rect) => {
    updateBand(bandId, {
      bandRect: { ...next },
      dividerRect: { ...next },
      height: next.height,
    });
  };

  const applyBandGroupDragPreview = (leaderX: number, leaderY: number) => {
    const drag = useDesignerStore.getState().bandGroupDrag;
    if (!drag || drag.leaderId !== bandId) return;

    const leaderStart = drag.startRects[bandId];
    if (!leaderStart) return;

    const dx = leaderX - leaderStart.x;
    const dy = leaderY - leaderStart.y;
    const previews: Record<string, { x: number; y: number }> = {};
    for (const id of drag.memberIds) {
      const start = drag.startRects[id];
      if (!start) continue;
      previews[id] = { x: start.x + dx, y: start.y + dy };
    }
    setDragPreviewRects(previews);
  };

  const startBandMoveDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (isBandGroupFollower) return;
    if (isVectorLineHandle(e.target)) return;

    e.stopPropagation();
    e.preventDefault();
    cancelComponentGroupDrag();
    cancelBandGroupDrag();
    const hasModifier = e.ctrlKey || e.metaKey || e.shiftKey;
    if (hasModifier || !isSelected) {
      selectItem(bandId, e);
    }

    const pointerId = e.pointerId;
    const captureTarget = e.currentTarget as Element;
    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = { ...rect };
    movedDuringDragRef.current = false;
    dragActivatedRef.current = false;
    previewRectRef.current = null;
    setPreviewRect(null);

    attachDocumentPointerDrag({
      pointerId,
      captureTarget,
      onMove: (moveEvent) => {
        if (
          !hasExceededScreenDragThreshold(
            startX,
            startY,
            moveEvent.clientX,
            moveEvent.clientY
          )
        ) {
          return;
        }

        if (!dragActivatedRef.current) {
          dragActivatedRef.current = true;
          stylePreviewDebug.countAction('dragBand:start', { bandId });
          beginBandGroupDrag(bandId);
        }

        movedDuringDragRef.current = true;
        const { dx, dy } = screenDeltaToPageDelta(
          moveEvent.clientX - startX,
          moveEvent.clientY - startY,
          rootRef.current,
          zoom
        );
        const next = translateBandRect(startRect, dx, dy);
        const snapped = snapBandRect(
          { x: next.x, y: next.y, width: next.width, height: next.height },
          bandId,
          moveEvent.shiftKey
        );
        const snappedRect = { ...next, x: snapped.x, y: snapped.y };

        const activeGroup = useDesignerStore.getState().bandGroupDrag;
        if (activeGroup?.leaderId === bandId && activeGroup.memberIds.length > 1) {
          applyBandGroupDragPreview(snapped.x, snapped.y);
        } else {
          previewRectRef.current = snappedRect;
          setPreviewRect(snappedRect);
        }

        stylePreviewDebug.countAction('dragBand:move', {
          bandId,
          x: snapped.x,
          y: snapped.y,
        });
      },
      onEnd: () => {
        const activeGroup = useDesignerStore.getState().bandGroupDrag;
        const finalRect = previewRectRef.current;
        const leaderPreview = useDesignerStore.getState().dragPreviewRects?.[bandId];

        if (activeGroup?.leaderId === bandId && activeGroup.memberIds.length > 1 && leaderPreview) {
          stylePreviewDebug.countAction('dragBand:stop', {
            bandId,
            x: leaderPreview.x,
            y: leaderPreview.y,
          });
          commitBandGroupDrag(bandId, leaderPreview);
        } else if (finalRect) {
          stylePreviewDebug.countAction('dragBand:stop', {
            bandId,
            x: finalRect.x,
            y: finalRect.y,
          });
          cancelBandGroupDrag();
          commitBandPosition(finalRect);
        } else {
          cancelBandGroupDrag();
        }

        previewRectRef.current = null;
        setPreviewRect(null);
        clearSnapGuides();
      },
    });
  };

  const selectBandIfBackground = (e: React.MouseEvent) => {
    if (movedDuringDragRef.current) {
      movedDuringDragRef.current = false;
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest('.band-toolbar, .no-drag, .vector-line-handle')) return;
    stopCanvasBubble(e);
    selectItem(bandId);
  };

  return (
    <div
      ref={rootRef}
      data-band-overlay
      className="absolute touch-none"
      style={{
        left: displayRect.x,
        top: displayRect.y,
        width: displayRect.width,
        height: displayRect.height,
        zIndex,
      }}
      onClick={selectBandIfBackground}
    >
      {isSelected && (
        <BandToolbar
          label={getBandDisplayLabel(band.type)}
          showAddText={false}
          onDuplicate={() => duplicateBand(bandId)}
          onDelete={() => removeBand(bandId)}
          onGripPointerDown={startBandMoveDrag}
        />
      )}

      <div
        className={cn(
          'band-surface relative h-full min-h-[8px] overflow-visible pointer-events-auto',
          isSelected && 'cursor-move'
        )}
        onPointerDown={startBandMoveDrag}
      >
        {isSelected ? (
          <DividerLineEditor
            bandId={bandId}
            line={resolveDividerLine(band, displayRect)}
            color={band.dividerColor}
            thickness={band.dividerThickness}
            anchorRef={rootRef}
          />
        ) : (
          <DividerLine
            line={resolveDividerLine(band, displayRect)}
            color={band.dividerColor}
            thickness={band.dividerThickness}
          />
        )}
      </div>
    </div>
  );
});
