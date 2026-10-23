import React, { useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { stylePreviewDebug } from '../../../../../shared/diagnostics/stylePreviewDebug';
import { cn } from '../../../../../shared/ui/cn';
import {
  getBandRect,
  getBandZIndex,
  getBandDisplayLabel,
  getListRowContentInset,
  isListDataBand,
  isNumberedListBand,
  isTableDataBand,
} from '../../../../band/domain';
import { DataBandTableView } from '../../../../band/ui';
import { getDataSourceLabel } from '../../../../data-source/domain';
import { useDataSourceCatalog } from '../../../../data-source/ui';
import { getReportPage } from '../../../../report/domain';
import { useDesignerStore, useDesignerStoreApi } from '../../../application/store/DesignerStoreContext';
import { canBandAcceptPastedComponents } from '../../../domain/designerClipboard';
import { getPrimarySelectedId, isIdSelected } from '../../../domain/selectionUtils';
import { resolveCanvasSelectionAtPointer } from '../canvasHitTest';
import { shouldSuppressDesignerCanvasZBoost } from '../canvasZBoost';
import { ComponentFloatingToolbar } from '../components/ComponentFloatingToolbar';
import { ComponentRenderer } from '../components/ComponentRenderer';
import { handleBandSurfaceDrop, hasDesignerDrag } from '../designerDragDrop';
import { useCanvasSelectionClasses } from '../designerSelectionContext';
import { useDesignerZoom } from '../designerZoomContext';
import { ResizeHandle } from '../ResizeHandle';
import { useDesignerSnap } from '../useDesignerSnap';
import { useSelectionClick } from '../useSelectionClick';
import { BandContentHint } from './BandContentHint';
import { BandToolbar } from './BandToolbar';
import { BandLinesEditorOverlay } from './BandLinesEditorOverlay';
import { DataBandListPreview } from './DataBandListPreview';
import { AssistantFlashRing } from '../AssistantFlashRing';
import { BandFrameEditorOverlay } from './BandFrameEditorOverlay';
import { getDesignerPageScale } from './dividerBandInteraction';
import { DividerBandOverlay } from './DividerBandOverlay';
import { GroupBandHint } from './GroupBandHint';

interface PlacedBandOverlayProps {
  bandId: string;
}

function stopCanvasBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export const PlacedBandOverlay = React.memo(function PlacedBandOverlay({
  bandId,
}: PlacedBandOverlayProps) {
  const designerStore = useDesignerStoreApi();
  const band = useDesignerStore((state) => state.report.bands[bandId]);
  const dataSourceCatalog = useDataSourceCatalog();
  const floatingComponent = useDesignerStore((state) => {
    if (state.selectedIds.length !== 1 || state.draggingComponentId !== null) return null;
    const component = state.report.components[state.selectedIds[0]];
    return component?.parentId === bandId ? component : null;
  });
  // Nomes das bandas filhas (string estável para o seletor não re-renderizar à toa)
  const childBandNames = useDesignerStore((state) =>
    Object.values(state.report.bands)
      .filter((child) => child.link?.parentBandId === bandId)
      .map((child) => child.name)
      .join('\u0000')
  );
  const report = useDesignerStore((state) => state.report);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const page = getReportPage(report, activePageId)!;
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const selectItem = useSelectionClick();
  const setSelection = useDesignerStore((state) => state.setSelection);
  const updateBand = useDesignerStore((state) => state.updateBand);
  const removeBand = useDesignerStore((state) => state.removeBand);
  const duplicateBand = useDesignerStore((state) => state.duplicateBand);
  const clipboard = useDesignerStore((state) => state.clipboard);
  const pasteToTargetBand = useDesignerStore((state) => state.pasteToTargetBand);
  const addComponent = useDesignerStore((state) => state.addComponent);
  const addElement = useDesignerStore((state) => state.addElement);
  const addListWithField = useDesignerStore((state) => state.addListWithField);
  const addBand = useDesignerStore((state) => state.addBand);
  const bandGroupDrag = useDesignerStore((state) => state.bandGroupDrag);
  const storeBandPreview = useDesignerStore((state) => state.dragPreviewRects?.[bandId]);
  const beginBandGroupDrag = useDesignerStore((state) => state.beginBandGroupDrag);
  const setDragPreviewRects = useDesignerStore((state) => state.setDragPreviewRects);
  const commitBandGroupDrag = useDesignerStore((state) => state.commitBandGroupDrag);
  const cancelBandGroupDrag = useDesignerStore((state) => state.cancelBandGroupDrag);
  const cancelComponentGroupDrag = useDesignerStore((state) => state.cancelComponentGroupDrag);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [dragOverride, setDragOverride] = useState<{ x: number; y: number } | null>(null);
  const zoom = useDesignerZoom();
  const nodeRef = useRef<HTMLDivElement>(null);
  const { snapBandRect, clearSnapGuides } = useDesignerSnap();
  const selectionClasses = useCanvasSelectionClasses();
  const textEditorModalOpen = useDesignerStore((state) =>
    shouldSuppressDesignerCanvasZBoost(state)
  );
  const isHoverTarget = useDesignerStore((state) => state.canvasHoverId === bandId);

  stylePreviewDebug.countRender(`PlacedBandOverlay:${bandId}`);

  if (!band) return null;

  if (band.type === 'divider') {
    return <DividerBandOverlay bandId={bandId} />;
  }

  const rect = getBandRect(band, page);
  const isSelected = isIdSelected(selectedIds, bandId);
  const isHovered = isHoverTarget && !isSelected;
  // Elemento solto: a banda é só um invólucro invisível — o usuário vê e mexe no componente
  const isElement = Boolean(band.element);
  const isTableLayout = isTableDataBand(band);
  const isNumberedLayout = isNumberedListBand(band);
  const isListLayout = isListDataBand(band) && !isTableLayout;
  const childLabels = childBandNames ? childBandNames.split('\u0000') : [];
  const isGroupBand = band.components.length === 0 && childLabels.length > 0;
  const showListHint = isListLayout && band.components.length === 0 && !isGroupBand;
  const datasetLabel = band.dataSource ? getDataSourceLabel(band.dataSource, dataSourceCatalog) : undefined;
  const rowHeight = rect.height;
  const minHeight = 20;
  const minWidth = 60;
  const hasSelectedChild = band.components.some((cId) => selectedIds.includes(cId));
  const isBandGroupFollower =
    bandGroupDrag !== null &&
    bandGroupDrag.leaderId !== bandId &&
    bandGroupDrag.memberIds.includes(bandId);
  const bandActive = isSelected || hasSelectedChild;
  const zIndex = getBandZIndex(
    bandId,
    page,
    textEditorModalOpen ? null : bandActive ? bandId : null
  );
  const canPaste =
    Boolean(clipboard?.items.length) && canBandAcceptPastedComponents(band);

  const selectBandIfBackground = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.component-node, .band-toolbar, .no-drag, .vector-line-handle')) return;
    stopCanvasBubble(e);
    const state = designerStore.getState();
    const next = resolveCanvasSelectionAtPointer(
      e.clientX,
      e.clientY,
      zoom,
      state.report,
      page,
      state.dragPreviewRects,
      {
        altKey: e.altKey,
        primarySelectedId: getPrimarySelectedId(state.selectedIds),
        fallbackId: bandId,
      }
    );
    const mode = e.ctrlKey || e.metaKey ? 'toggle' : e.shiftKey ? 'add' : 'replace';
    if (next.id !== bandId || e.altKey) {
      setSelection(next.id, { mode, bringToFront: next.bringToFront });
      return;
    }
    const hasModifier = e.ctrlKey || e.metaKey || e.shiftKey;
    if (hasModifier || !isSelected) {
      selectItem(bandId, e);
    }
  };

  const patchRect = (patch: Partial<typeof rect>) => {
    const next = { ...rect, ...patch };
    const updates: Parameters<typeof updateBand>[1] = {
      bandRect: next,
      height: next.height,
    };
    updateBand(bandId, updates);
  };

  const dragPosition = useMemo(
    () => ({ x: rect.x, y: rect.y }),
    [rect.x, rect.y]
  );
  const position = storeBandPreview ?? dragOverride ?? dragPosition;

  const applyBandGroupDragPreview = (leaderX: number, leaderY: number) => {
    const drag = designerStore.getState().bandGroupDrag;
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

  const handleBandDragMove = (e: MouseEvent, data: { x: number; y: number }) => {
    const snapped = snapBandRect(
      { x: data.x, y: data.y, width: rect.width, height: rect.height },
      bandId,
      e.shiftKey
    );

    const activeGroup = designerStore.getState().bandGroupDrag;
    if (activeGroup?.leaderId === bandId && activeGroup.memberIds.length > 1) {
      applyBandGroupDragPreview(snapped.x, snapped.y);
    } else {
      setDragOverride({ x: snapped.x, y: snapped.y });
    }

    stylePreviewDebug.countAction('dragBand:move', { bandId, x: snapped.x, y: snapped.y });
  };

  const handleBandDragStop = (e: MouseEvent, data: { x: number; y: number }) => {
    // Clique sem movimento: não aplica o "imã" das guias (senão o clique desloca a banda).
    if (data.x === rect.x && data.y === rect.y) {
      setDragOverride(null);
      clearSnapGuides();
      cancelBandGroupDrag();
      return;
    }
    const snapped = snapBandRect(
      { x: data.x, y: data.y, width: rect.width, height: rect.height },
      bandId,
      e.shiftKey
    );
    setDragOverride(null);
    clearSnapGuides();
    stylePreviewDebug.countAction('dragBand:stop', { bandId, x: snapped.x, y: snapped.y });

    const activeGroup = designerStore.getState().bandGroupDrag;
    if (activeGroup?.leaderId === bandId && activeGroup.memberIds.length > 1) {
      commitBandGroupDrag(bandId, { x: snapped.x, y: snapped.y });
    } else if (snapped.x !== rect.x || snapped.y !== rect.y) {
      cancelBandGroupDrag();
      patchRect({ x: snapped.x, y: snapped.y });
    } else {
      cancelBandGroupDrag();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    stopCanvasBubble(e);
    e.preventDefault();
    stylePreviewDebug.countAction('resizeBand:start', { bandId });

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    const onMove = (moveEvent: MouseEvent) => {
      const scale = getDesignerPageScale(nodeRef.current, zoom);
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      stylePreviewDebug.countAction('resizeBand:move', { bandId });
      patchRect({
        width: Math.max(minWidth, startWidth + deltaX),
        height: Math.max(minHeight, startHeight + deltaY),
      });
    };

    const onUp = () => {
      stylePreviewDebug.countAction('resizeBand:end', { bandId });
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDropTarget(false);
    handleBandSurfaceDrop(
      e,
      {
        bandId,
        zoom,
        rowHeight,
        isTableLayout,
        isElement: Boolean(band.element),
        band,
        dataContext: { data: designerStore.getState().data, catalog: dataSourceCatalog, components: designerStore.getState().report.components },
      },
      { addBand, addComponent, addElement, addListWithField }
    );
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onStart={(e) => {
        stylePreviewDebug.countAction('dragBand:start', { bandId });
        setDragOverride(null);
        clearSnapGuides();
        cancelComponentGroupDrag();
        cancelBandGroupDrag();
        if (!isSelected) {
          selectItem(bandId, e);
        }
        beginBandGroupDrag(bandId);
      }}
      onDrag={handleBandDragMove}
      onStop={handleBandDragStop}
      bounds="parent"
      scale={zoom}
      disabled={isBandGroupFollower}
      handle=".band-drag-handle"
      cancel=".no-drag,.component-node,.vector-line-handle"
    >
      <div
        ref={nodeRef}
        data-band-overlay
        data-band-id={bandId}
        className="absolute"
        style={{
          width: rect.width,
          height: rect.height,
          zIndex,
        }}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.band-drag-handle, .vector-line-handle')) return;
          stopCanvasBubble(e);
        }}
        onClick={selectBandIfBackground}
        onDragEnter={(e) => {
          if (hasDesignerDrag(e)) setIsDropTarget(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDropTarget(false);
          }
        }}
        onDragOver={(e) => {
          if (!hasDesignerDrag(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={handleDrop}
      >
        {bandActive && !isElement && (
          <BandToolbar
            label={band.name || getBandDisplayLabel(band.type)}
            meta={datasetLabel}
            showAddText={!isTableLayout}
            onAddText={() => addComponent(bandId, 'text')}
            onDuplicate={() => duplicateBand(bandId)}
            onPaste={canPaste ? () => pasteToTargetBand(bandId) : undefined}
            onDelete={() => removeBand(bandId)}
            onGripSelect={(e) => {
              if (e.button !== 0) return;
              const hasModifier = e.ctrlKey || e.metaKey || e.shiftKey;
              if (hasModifier || !isSelected) {
                selectItem(bandId, e);
              }
            }}
          />
        )}

        <div
          className={cn(
            'band-surface relative w-full h-full transition-shadow',
            isElement
              ? 'overflow-visible'
              : cn(
                  'overflow-hidden bg-white border border-neutral-200/70 rounded-sm',
                  bandActive
                    ? selectionClasses.bandActive
                    : isHovered
                      ? selectionClasses.bandHovered
                      : selectionClasses.bandIdle,
                  isDropTarget && 'ring-2 ring-indigo-400/50 ring-inset',
                  !hasSelectedChild && 'band-drag-handle cursor-grab active:cursor-grabbing'
                )
          )}
        >
          {isTableLayout && band.dataSource ? (
            <DataBandTableView
              band={band}
              rows={[]}
              dataSource={band.dataSource}
              variant="design"
            />
          ) : isListLayout ? (
            <>
              {showListHint && (
                <BandContentHint variant={isNumberedLayout ? 'numbered' : 'list'} />
              )}
              {isGroupBand && <GroupBandHint groupLabel={datasetLabel ?? band.name} childLabels={childLabels} />}
              <DataBandListPreview band={band} rowHeight={rowHeight} />
            </>
          ) : (
            <div
              className={cn(
                'band-components-layer relative w-full h-full isolate',
                isElement ? 'overflow-visible' : 'hide-scrollbar'
              )}
            >
              {band.components.map((compId) => (
                <ComponentRenderer key={compId} componentId={compId} />
              ))}
            </div>
          )}
          {!isElement && !isTableLayout && <BandLinesEditorOverlay bandId={bandId} width={rect.width} height={rect.height} />}
          {!isElement && <BandFrameEditorOverlay bandId={bandId} width={rect.width} height={rect.height} />}
        </div>

        <AssistantFlashRing id={bandId} kind="band" />

        {isSelected && !isElement && (
          <ResizeHandle onMouseDown={handleResizeStart} className="z-30" />
        )}

        {floatingComponent && !textEditorModalOpen && (
          <ComponentFloatingToolbar
            component={floatingComponent}
            left={floatingComponent.rect.x + (isListLayout ? getListRowContentInset(band) : 0)}
            top={floatingComponent.rect.y + floatingComponent.rect.height + 6}
          />
        )}
      </div>
    </Draggable>
  );
});
