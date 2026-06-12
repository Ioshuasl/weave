import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDesignerStore } from '../../store/designerStore';
import Draggable from 'react-draggable';
import { cn } from '../../utils/cn';
import { mergeLiveStyleOverlay } from '../../utils/componentStyleUtils';
import { mergeLiveChartProps } from '../../utils/chartPropsUtils';
import { stylePreviewDebug } from '../../utils/stylePreviewDebug';
import { useDesignerZoom } from './designerZoomContext';
import { getDesignerPageScale } from '../../utils/dividerBandInteraction';
import { InlineTextEditor } from './InlineTextEditor';
import { ResizeHandle } from './ResizeHandle';
import { useCanvasSelectionClasses } from './designerSelectionContext';
import { ReportChart } from '../ReportChart';
import { FormattedText } from '../FormattedText';
import { useDesignerSnap } from '../../hooks/useDesignerSnap';
import { useSelectionClick } from '../../hooks/useSelectionClick';
import { isIdSelected } from '../../utils/selectionUtils';
import { DESIGNER_DRAG_START_DISTANCE_PX } from '../../utils/designerDragThreshold';
import { useDataSourceCatalog } from './designerHostContext';
import { buildExpressionFieldSuggestions } from '../../utils/expressionFieldSuggestions';
import { pushRecentFieldToken } from '../../utils/fieldRecentStorage';
import { evaluateExpression } from '../../utils/reportUtils';
import { DESIGN_MODE_SYSTEM_VARIABLES } from '../../utils/systemVariables';

interface ComponentRendererProps {
  componentId: string;
}

/** Referência estável — evita loop infinito no useSyncExternalStore (React 19) */
const EMPTY_CHART_DATA: never[] = [];

export const ComponentRenderer = React.memo(function ComponentRenderer({
  componentId,
}: ComponentRendererProps) {
  const component = useDesignerStore((state) => state.report.components[componentId]);
  const reportId = useDesignerStore((state) => state.report.id);
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
  const selectItem = useSelectionClick();
  const setDraggingComponentId = useDesignerStore((state) => state.setDraggingComponentId);
  const beginComponentGroupDrag = useDesignerStore((state) => state.beginComponentGroupDrag);
  const setDragPreviewRects = useDesignerStore((state) => state.setDragPreviewRects);
  const commitComponentGroupDrag = useDesignerStore((state) => state.commitComponentGroupDrag);
  const cancelComponentGroupDrag = useDesignerStore((state) => state.cancelComponentGroupDrag);
  const updateComponent = useDesignerStore((state) => state.updateComponent);
  const previewData = useDesignerStore((state) => state.data);
  const dataSourceCatalog = useDataSourceCatalog();
  const chartData = useDesignerStore((state) => {
    const comp = state.report.components[componentId];
    if (comp?.type !== 'chart' || !comp.chartProps) return EMPTY_CHART_DATA;
    return state.data[comp.chartProps.dataset] ?? EMPTY_CHART_DATA;
  });
  const nodeRef = useRef<HTMLDivElement>(null);
  const zoom = useDesignerZoom();
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [dragOverride, setDragOverride] = useState<{ x: number; y: number } | null>(null);
  const { snapComponentRect, clearSnapGuides } = useDesignerSnap();
  const selectionClasses = useCanvasSelectionClasses();
  const expressionSuggestions = useMemo(
    () => buildExpressionFieldSuggestions(previewData, dataSourceCatalog),
    [previewData, dataSourceCatalog]
  );
  const trackInlineFieldInsert = useCallback(
    (token: string) => {
      pushRecentFieldToken(token, reportId);
    },
    [reportId]
  );

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

  stylePreviewDebug.countRender(`ComponentRenderer:${componentId}`);

  if (!component) return null;

  const isText = component.type === 'text';
  const canvasTextContent = isText
    ? evaluateExpression(component.content, {
        sys: DESIGN_MODE_SYSTEM_VARIABLES,
        data: previewData,
        dataSourceCatalog,
      })
    : component.content;
  const mergedStyle = mergeLiveStyleOverlay(component.style, styleOverlay);
  const stackZ =
    isSelected || isEditing ? 1000 : componentStackIndex >= 0 ? componentStackIndex + 2 : 1;

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

  const handleDragMove = (e: MouseEvent, dragData: { x: number; y: number }) => {
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

  const handleDragStop = (e: MouseEvent, dragData: { x: number; y: number }) => {
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

  const handleDragStart = (e: MouseEvent) => {
    e.stopPropagation();
    stylePreviewDebug.countAction('dragComponent:start', { componentId });
    setDragOverride(null);
    clearSnapGuides();
    cancelComponentGroupDrag();
    setDraggingComponentId(componentId);

    if (!isEditing && !isSelected) {
      selectItem(componentId, e);
    }

    if (isSelected || useDesignerStore.getState().selectedIds.includes(componentId)) {
      beginComponentGroupDrag(componentId);
    }
  };

  const handlePointerDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (!isEditing) {
      const hasModifier = e.ctrlKey || e.metaKey || e.shiftKey;
      if (hasModifier || !isSelected) {
        selectItem(componentId, e);
      }
    }
  };

  const startInlineEdit = (e: React.MouseEvent) => {
    if (!isText) return;
    e.stopPropagation();
    selectItem(componentId);
    setEditDraft(component.content);
    setIsEditing(true);
  };

  const commitInlineEdit = () => {
    if (isEditing) {
      updateComponent(componentId, { content: editDraft });
      setIsEditing(false);
    }
  };

  const cancelInlineEdit = () => {
    setEditDraft(component.content);
    setIsEditing(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
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

  const getJustifyContent = (textAlign?: React.CSSProperties['textAlign']) => {
    switch (textAlign) {
      case 'center':
        return 'center';
      case 'right':
        return 'flex-end';
      default:
        return 'flex-start';
    }
  };

  const computedStyle: React.CSSProperties = {
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
      distance={DESIGNER_DRAG_START_DISTANCE_PX}
      disabled={isEditing || isGroupFollower}
      cancel=".no-drag,.inline-text-editor"
    >
      <div
        ref={nodeRef}
        className="component-node absolute"
        data-component-id={componentId}
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={startInlineEdit}
        style={{
          width: component.rect.width,
          height: component.rect.height,
          zIndex: stackZ,
        }}
      >
        <div
          className={cn(
            'component-body w-full h-full overflow-hidden relative group',
            isSelected || isEditing
              ? selectionClasses.active
              : selectionClasses.idle,
            !isEditing && !isText && 'cursor-grab active:cursor-grabbing',
            isText && !isEditing && (isSelected ? 'cursor-text' : 'cursor-grab active:cursor-grabbing')
          )}
        >
          <div
            className={cn(
              'w-full h-full px-1 flex',
              (isText || isEditing) && 'hide-scrollbar items-start whitespace-normal',
              !isText && !isEditing && 'overflow-hidden items-center whitespace-nowrap'
            )}
            style={computedStyle}
          >
            {isText && isEditing ? (
              <InlineTextEditor
                value={editDraft}
                onChange={setEditDraft}
                onCommit={commitInlineEdit}
                onCancel={cancelInlineEdit}
                expressionSuggestions={expressionSuggestions}
                onFieldInserted={trackInlineFieldInsert}
                style={{
                  fontSize: mergedStyle.fontSize,
                  fontWeight: mergedStyle.fontWeight,
                  color: mergedStyle.color,
                  textAlign: mergedStyle.textAlign,
                }}
              />
            ) : (
              <>
                {isText && (
                  <FormattedText
                    content={canvasTextContent}
                    className="w-full break-words"
                    style={{
                      color: mergedStyle.color,
                      fontSize: mergedStyle.fontSize,
                    }}
                  />
                )}
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
                  <ReportChart
                    className="absolute inset-0 pointer-events-none"
                    data={chartData}
                    chartProps={mergedChartProps}
                    width={component.rect.width}
                    height={component.rect.height}
                    reportData={previewData}
                    dataSourceCatalog={dataSourceCatalog}
                  />
                )}
              </>
            )}
          </div>

          {isText && isSelected && !isEditing && (
            <p className="no-drag absolute -bottom-4 left-0 text-[9px] text-neutral-400 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Duplo-clique para editar
            </p>
          )}

          {isSelected && !isEditing && selectedComponentCount <= 1 && (
            <ResizeHandle onMouseDown={handleResizeStart} />
          )}
        </div>
      </div>
    </Draggable>
  );
});
