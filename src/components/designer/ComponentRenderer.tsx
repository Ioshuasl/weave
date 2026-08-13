import {
  memo,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useDesignerStore } from '../../store/designerStore';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { cn } from '../../utils/cn';
import { mergeLiveStyleOverlay } from '../../utils/componentStyleUtils';
import { mergeLiveChartProps } from '../../utils/chartPropsUtils';
import { stylePreviewDebug } from '../../utils/stylePreviewDebug';
import { useDesignerZoom } from './designerZoomContext';
import { getDesignerPageScale } from '../../utils/dividerBandInteraction';
import { ResizeHandle } from './ResizeHandle';
import { useCanvasSelectionClasses } from './designerSelectionContext';
import { DesignerChartPlaceholder } from './DesignerChartPlaceholder';
import { FormattedText } from '../FormattedText';
import { useDesignerSnap } from '../../hooks/useDesignerSnap';
import { useSelectionClick } from '../../hooks/useSelectionClick';
import { isIdSelected } from '../../utils/selectionUtils';
import { mergeTextEditorDraftStyle } from '../../utils/textEditorModalUtils';
import { shouldSuppressDesignerCanvasZBoost } from '../../utils/designerZIndex';

interface ComponentRendererProps {
  componentId: string;
}

export const ComponentRenderer = memo(function ComponentRenderer({
  componentId,
}: ComponentRendererProps) {
  const component = useDesignerStore((state) => state.report.components[componentId]);
  const openTextEditorModal = useDesignerStore((state) => state.openTextEditorModal);
  const componentStackIndex = useDesignerStore((state) => {
    const comp = state.report.components[componentId];
    if (!comp) return -1;
    return state.report.bands[comp.parentId]?.components.indexOf(componentId) ?? -1;
  });
  const isSelected = useDesignerStore((state) => isIdSelected(state.selectedIds, componentId));
  const selectedComponentCount = useDesignerStore(
    (state) =>
      state.selectedIds.filter((id) => Boolean(state.report.components[id])).length
  );
  const groupDrag = useDesignerStore((state) => state.componentGroupDrag);
  const storeDragPreview = useDesignerStore((state) => state.dragPreviewRects?.[componentId]);
  const isGroupFollower =
    groupDrag !== null &&
    groupDrag.leaderId !== componentId &&
    groupDrag.memberIds.includes(componentId);
  const previewColor = useDesignerStore((state) =>
    state.liveStylePreview?.componentId === componentId
      ? (state.liveStylePreview.style.color as string | undefined) ?? null
      : null
  );
  const previewBackgroundColor = useDesignerStore((state) =>
    state.liveStylePreview?.componentId === componentId
      ? (state.liveStylePreview.style.backgroundColor as string | undefined) ?? null
      : null
  );
  const liveChartPatch = useDesignerStore((state) =>
    state.liveChartPreview?.componentId === componentId
      ? state.liveChartPreview.chartProps
      : null
  );
  const textEditorDraft = useDesignerStore((state) =>
    state.textEditorModal?.componentId === componentId
      ? state.textEditorModal.draft
      : null
  );
  const isTextEditorLivePreview = textEditorDraft != null;
  const textEditorModalOpen = useDesignerStore((state) =>
    shouldSuppressDesignerCanvasZBoost(state)
  );
  const selectItem = useSelectionClick();
  const setDraggingComponentId = useDesignerStore((state) => state.setDraggingComponentId);
  const beginComponentGroupDrag = useDesignerStore((state) => state.beginComponentGroupDrag);
  const setDragPreviewRects = useDesignerStore((state) => state.setDragPreviewRects);
  const commitComponentGroupDrag = useDesignerStore((state) => state.commitComponentGroupDrag);
  const cancelComponentGroupDrag = useDesignerStore((state) => state.cancelComponentGroupDrag);
  const updateComponent = useDesignerStore((state) => state.updateComponent);
  const nodeRef = useRef<HTMLDivElement>(null);
  const zoom = useDesignerZoom();
  const [dragOverride, setDragOverride] = useState<{ x: number; y: number } | null>(null);
  const { snapComponentRect, clearSnapGuides } = useDesignerSnap();
  const selectionClasses = useCanvasSelectionClasses();

  const styleOverlay = useMemo(() => {
    if (previewColor == null && previewBackgroundColor == null) return null;
    return {
      ...(previewColor != null ? { color: previewColor } : {}),
      ...(previewBackgroundColor != null ? { backgroundColor: previewBackgroundColor } : {}),
    };
  }, [previewColor, previewBackgroundColor]);
  const dragPosition = useMemo(
    () => ({
      x: component?.rect.x ?? 0,
      y: component?.rect.y ?? 0,
    }),
    [component?.rect.x, component?.rect.y]
  );
  const position = storeDragPreview ?? dragOverride ?? dragPosition;
  const mergedChartProps = useMemo(
    () => mergeLiveChartProps(component?.chartProps, liveChartPatch),
    [component?.chartProps, liveChartPatch]
  );

  const isText = component?.type === 'text';
  const canvasTextContent = textEditorDraft?.content ?? component?.content ?? '';

  stylePreviewDebug.countRender(`ComponentRenderer:${componentId}`);

  if (!component) return null;

  const mergedStyle = mergeLiveStyleOverlay(
    mergeTextEditorDraftStyle(component.style, textEditorDraft),
    styleOverlay
  );
  const stackZ = textEditorModalOpen
    ? componentStackIndex >= 0
      ? componentStackIndex + 2
      : 1
    : isSelected
      ? 1000
      : componentStackIndex >= 0
        ? componentStackIndex + 2
        : 1;

  const applyGroupDragPreview = (leaderX: number, leaderY: number) => {
    const drag = useDesignerStore.getState().componentGroupDrag;
    if (!drag || drag.leaderId !== componentId) return;

    const leaderStart = drag.startRects[componentId];
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

  const handleDragMove = (e: DraggableEvent, dragData: DraggableData) => {
    const snapped = snapComponentRect(
      {
        x: dragData.x,
        y: dragData.y,
        width: component.rect.width,
        height: component.rect.height,
      },
      component.parentId,
      componentId,
      e.shiftKey
    );

    const activeGroup = useDesignerStore.getState().componentGroupDrag;
    if (activeGroup?.leaderId === componentId && activeGroup.memberIds.length > 1) {
      applyGroupDragPreview(snapped.x, snapped.y);
    } else {
      setDragOverride({ x: snapped.x, y: snapped.y });
    }

    stylePreviewDebug.countAction('dragComponent:move', {
      componentId,
      x: snapped.x,
      y: snapped.y,
    });
  };

  const handleDragStop = (e: DraggableEvent, dragData: DraggableData) => {
    const snapped = snapComponentRect(
      {
        x: dragData.x,
        y: dragData.y,
        width: component.rect.width,
        height: component.rect.height,
      },
      component.parentId,
      componentId,
      e.shiftKey
    );
    setDragOverride(null);
    clearSnapGuides();
    stylePreviewDebug.countAction('dragComponent:stop', {
      componentId,
      x: snapped.x,
      y: snapped.y,
    });
    setDraggingComponentId(null);

    if (snapped.x === component.rect.x && snapped.y === component.rect.y) {
      cancelComponentGroupDrag();
      return;
    }

    const activeGroup = useDesignerStore.getState().componentGroupDrag;
    if (activeGroup?.leaderId === componentId && activeGroup.memberIds.length > 1) {
      commitComponentGroupDrag(componentId, { x: snapped.x, y: snapped.y });
    } else {
      cancelComponentGroupDrag();
      updateComponent(componentId, {
        rect: { ...component.rect, x: snapped.x, y: snapped.y },
      });
    }
  };

  const handleDragStart = (e: DraggableEvent, _data: DraggableData) => {
    e.stopPropagation();
    stylePreviewDebug.countAction('dragComponent:start', { componentId });
    setDragOverride(null);
    clearSnapGuides();
    cancelComponentGroupDrag();
    setDraggingComponentId(componentId);

    if (!isSelected) {
      selectItem(componentId, e);
    }

    if (isSelected || useDesignerStore.getState().selectedIds.includes(componentId)) {
      beginComponentGroupDrag(componentId);
    }
  };

  const handlePointerDown = (e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const hasModifier = e.ctrlKey || e.metaKey || e.shiftKey;
    if (hasModifier || !isSelected) {
      selectItem(componentId, e);
    }
  };

  const openTextEditor = (e: ReactMouseEvent) => {
    if (!isText) return;
    e.stopPropagation();
    selectItem(componentId);
    openTextEditorModal(componentId);
  };

  const handleResizeStart = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    stylePreviewDebug.countAction('resizeComponent:start', { componentId });

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = component.rect.width;
    const startHeight = component.rect.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const scale = getDesignerPageScale(nodeRef.current, zoom);
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      stylePreviewDebug.countAction('resizeComponent:move', { componentId });

      updateComponent(componentId, {
        rect: {
          ...component.rect,
          width: Math.max(20, startWidth + deltaX),
          height: Math.max(20, startHeight + deltaY),
        },
      });
    };

    const handleMouseUp = () => {
      stylePreviewDebug.countAction('resizeComponent:end', { componentId });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getJustifyContent = (textAlign?: CSSProperties['textAlign']) => {
    switch (textAlign) {
      case 'center':
        return 'center';
      case 'right':
        return 'flex-end';
      default:
        return 'flex-start';
    }
  };

  const computedStyle: CSSProperties = {
    ...mergedStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: getJustifyContent(mergedStyle.textAlign),
    backgroundColor:
      mergedStyle.backgroundColor ||
      (component.type === 'shape' ? '#e5e5e5' : component.type === 'line' ? '#000' : undefined),
    border: mergedStyle.border || (component.type === 'shape' ? '1px solid #000' : undefined),
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onStart={handleDragStart}
      onDrag={handleDragMove}
      onStop={handleDragStop}
      bounds="parent"
      scale={zoom}
      disabled={isGroupFollower}
      cancel=".no-drag"
    >
      <div
        ref={nodeRef}
        className="component-node absolute"
        data-component-id={componentId}
        onPointerDown={handlePointerDown}
        onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
        onDoubleClick={openTextEditor}
        style={{
          width: component.rect.width,
          height: component.rect.height,
          zIndex: stackZ,
        }}
      >
        <div
          className={cn(
            'component-body w-full h-full overflow-hidden relative group',
            isSelected ? selectionClasses.active : selectionClasses.idle,
            isTextEditorLivePreview && 'ring-2 ring-indigo-400/70 ring-offset-1',
            !isText && 'cursor-grab active:cursor-grabbing',
            isText && (isSelected ? 'cursor-text' : 'cursor-grab active:cursor-grabbing')
          )}
        >
          <div
            className={cn(
              'w-full h-full px-1 flex',
              isText && 'hide-scrollbar items-start whitespace-normal',
              !isText && 'overflow-hidden items-center whitespace-nowrap'
            )}
            style={computedStyle}
          >
            {isText && (
              <FormattedText
                content={canvasTextContent}
                className="w-full break-words"
                style={{
                  color: mergedStyle.color,
                  fontSize: mergedStyle.fontSize,
                  textAlign: mergedStyle.textAlign,
                }}
              />
            )}
            {!isText && (
              <>
                {component.type === 'image' && (
                  <img
                    src={component.content}
                    alt="Imagem do relatório"
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                )}
                {component.type === 'table' && component.tableProps && (
                  <table className="w-full h-full border-collapse table-fixed">
                    {component.tableProps.columnWidths?.length ? (
                      <colgroup>
                        {component.tableProps.columnWidths.map((w, i) => (
                          <col key={i} style={{ width: w }} />
                        ))}
                      </colgroup>
                    ) : null}
                    <tbody>
                      {component.tableProps.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className={cn(
                                'border border-neutral-400 p-1 overflow-hidden',
                                component.tableProps?.hasHeader && rowIndex === 0
                                  ? 'bg-neutral-100 font-bold'
                                  : ''
                              )}
                              style={{
                                ...mergedStyle,
                                position: undefined,
                                width: undefined,
                                height: undefined,
                                backgroundColor:
                                  component.tableProps?.hasHeader && rowIndex === 0
                                    ? undefined
                                    : mergedStyle.backgroundColor,
                                fontWeight:
                                  component.tableProps?.hasHeader && rowIndex === 0
                                    ? 'bold'
                                    : mergedStyle.fontWeight,
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {component.type === 'chart' && mergedChartProps && (
                  <DesignerChartPlaceholder chartProps={mergedChartProps} />
                )}
              </>
            )}
          </div>

          {isTextEditorLivePreview && (
            <span className="no-drag absolute top-0.5 right-0.5 z-10 px-1.5 py-px rounded text-[9px] font-medium uppercase tracking-wide bg-indigo-600/90 text-white pointer-events-none">
              Editando
            </span>
          )}

          {isText && isSelected && (
            <p className="no-drag absolute -bottom-4 left-0 text-[9px] text-neutral-400 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Duplo-clique para abrir editor
            </p>
          )}

          {isSelected && selectedComponentCount <= 1 && (
            <ResizeHandle onMouseDown={handleResizeStart} />
          )}
        </div>
      </div>
    </Draggable>
  );
});
