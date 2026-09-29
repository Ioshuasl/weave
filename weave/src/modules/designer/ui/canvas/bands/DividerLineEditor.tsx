import React, { useRef } from 'react';
import {
  type DividerLineVector,
  getBandRect,
  angleFromCenterToPoint,
  applyDividerLineUpdate,
  lineCenter,
  resolveDividerLine,
  rotationHandlePosition,
  snapLineAngle,
  setLineAnglePreservingCenter,
} from '../../../../band/domain';
import { useDesignerStore } from '../../../application/store/designerStore';
import { getReportPage } from '../../../../report/domain';
import {
  attachDocumentPointerDrag,
  clientToBandLocal,
} from './dividerBandInteraction';
import { useDesignerZoom } from '../designerZoomContext';
import { DividerLine } from '../../../../band/ui';
import { cn } from '../../../../../shared/ui/cn';

interface DividerLineEditorProps {
  bandId: string;
  line: DividerLineVector;
  color?: string;
  thickness?: number;
  anchorRef: React.RefObject<HTMLElement | null>;
}

type DragMode = 'start' | 'end' | 'rotate';

const HANDLE_HIT = 14;
const LINE_HIT_WIDTH = 12;

/** Cursor de rotação (seta circular) — fallback: grab */
const ROTATE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-2.16-5.86'/%3E%3Cpolyline points='21 3 21 9 14 9'/%3E%3C/svg%3E") 10 10, grab`;

function VectorHandle({
  x,
  y,
  className,
  onPointerDown,
  title,
  variant = 'endpoint',
}: {
  x: number;
  y: number;
  className?: string;
  onPointerDown: (e: React.PointerEvent) => void;
  title: string;
  variant?: 'endpoint' | 'rotate';
}) {
  const half = HANDLE_HIT / 2;

  return (
    <div
      role="presentation"
      title={title}
      className={cn(
        'vector-line-handle no-drag absolute z-30 touch-none pointer-events-auto',
        variant === 'rotate' && 'active:cursor-grabbing',
        variant === 'endpoint' && 'cursor-crosshair',
        className
      )}
      style={{
        left: x - half,
        top: y - half,
        width: HANDLE_HIT,
        height: HANDLE_HIT,
        cursor: variant === 'rotate' ? ROTATE_CURSOR : undefined,
      }}
      onPointerDown={onPointerDown}
    >
      <span
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full',
          'bg-white border border-neutral-400 shadow-sm',
          'hover:border-neutral-600 transition-transform hover:scale-110',
          variant === 'rotate' ? 'w-2.5 h-2.5 border-neutral-300 bg-neutral-50' : 'w-3 h-3'
        )}
      />
    </div>
  );
}

export const DividerLineEditor: React.FC<DividerLineEditorProps> = ({
  bandId,
  line,
  color = '#a3a3a3',
  thickness = 1,
  anchorRef,
}) => {
  const updateBand = useDesignerStore((state) => state.updateBand);
  const report = useDesignerStore((state) => state.report);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const page = getReportPage(report, activePageId)!;
  const zoom = useDesignerZoom();
  const dragSessionRef = useRef(0);

  const getCurrentLine = () => {
    const current = useDesignerStore.getState().report.bands[bandId];
    if (!current) return line;
    return resolveDividerLine(current, getBandRect(current, page));
  };

  const commitLine = (nextLine: DividerLineVector) => {
    const current = useDesignerStore.getState().report.bands[bandId];
    if (!current) return;
    const rect = getBandRect(current, page);
    const updates = applyDividerLineUpdate(current, rect, nextLine, thickness);
    updateBand(bandId, updates);
  };

  const pointerToLocal = (clientX: number, clientY: number) => {
    const current = useDesignerStore.getState().report.bands[bandId];
    if (!current) return { x: 0, y: 0 };
    const rect = getBandRect(current, page);
    return clientToBandLocal(clientX, clientY, rect, anchorRef.current, zoom);
  };

  const startDrag = (mode: DragMode) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const pointerId = e.pointerId;
    const session = ++dragSessionRef.current;

    if (mode === 'rotate') {
      document.body.style.cursor = 'grabbing';
    }

    attachDocumentPointerDrag({
      pointerId,
      captureTarget: e.currentTarget,
      onMove: (moveEvent) => {
        if (dragSessionRef.current !== session) return;

        const local = pointerToLocal(moveEvent.clientX, moveEvent.clientY);
        const currentLine = getCurrentLine();

        if (mode === 'start') {
          let x1 = local.x;
          let y1 = local.y;
          if (moveEvent.shiftKey) {
            const angle = snapLineAngle(
              (Math.atan2(y1 - currentLine.y2, x1 - currentLine.x2) * 180) / Math.PI + 180
            );
            const len = Math.hypot(currentLine.x2 - x1, currentLine.y2 - y1) || 1;
            const rad = (angle * Math.PI) / 180;
            x1 = currentLine.x2 - Math.cos(rad) * len;
            y1 = currentLine.y2 - Math.sin(rad) * len;
          }
          commitLine({ ...currentLine, x1, y1 });
        } else if (mode === 'end') {
          let x2 = local.x;
          let y2 = local.y;
          if (moveEvent.shiftKey) {
            const angle = snapLineAngle(
              (Math.atan2(y2 - currentLine.y1, x2 - currentLine.x1) * 180) / Math.PI
            );
            const len = Math.hypot(x2 - currentLine.x1, y2 - currentLine.y1) || 1;
            const rad = (angle * Math.PI) / 180;
            x2 = currentLine.x1 + Math.cos(rad) * len;
            y2 = currentLine.y1 + Math.sin(rad) * len;
          }
          commitLine({ ...currentLine, x2, y2 });
        } else {
          const center = lineCenter(currentLine);
          const angle = angleFromCenterToPoint(center, local);
          const snapped = moveEvent.shiftKey ? snapLineAngle(angle) : angle;
          commitLine(setLineAnglePreservingCenter(currentLine, snapped));
        }
      },
      onEnd: () => {
        dragSessionRef.current += 1;
        if (mode === 'rotate') {
          document.body.style.cursor = '';
        }
      },
    });
  };

  const rotatePos = rotationHandlePosition(line);

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none">
      <DividerLine line={line} color={color} thickness={thickness} />
      <svg
        className="absolute inset-0 z-10 w-full h-full overflow-visible pointer-events-none"
        aria-hidden
      >
        <line
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="transparent"
          strokeWidth={LINE_HIT_WIDTH}
          style={{ pointerEvents: 'stroke' }}
        />
      </svg>
      <VectorHandle
        x={line.x1}
        y={line.y1}
        title="Ajustar início da linha"
        onPointerDown={startDrag('start')}
      />
      <VectorHandle
        x={line.x2}
        y={line.y2}
        title="Ajustar fim da linha"
        onPointerDown={startDrag('end')}
      />
      <VectorHandle
        x={rotatePos.x}
        y={rotatePos.y}
        variant="rotate"
        title="Rotacionar (Shift = snap 45°)"
        onPointerDown={startDrag('rotate')}
      />
    </div>
  );
};
