import type { DividerLineVector, ReportBand } from './band';
import type { Rect } from '../../../shared/domain/geometry';

export const DIVIDER_HANDLE_PADDING = 10;
export const DIVIDER_MIN_WIDTH = 24;
export const DIVIDER_MIN_HEIGHT = 8;

export function normalizeDividerAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function lineLength(line: DividerLineVector): number {
  return Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
}

export function lineAngleDegrees(line: DividerLineVector): number {
  const rad = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
  return normalizeDividerAngle((rad * 180) / Math.PI);
}

export function lineCenter(line: DividerLineVector): { x: number; y: number } {
  return { x: (line.x1 + line.x2) / 2, y: (line.y1 + line.y2) / 2 };
}

/** Comprimento máximo que cabe no retângulo para um dado ângulo */
export function maxLineLengthInRect(
  width: number,
  height: number,
  angleDeg: number,
  inset = 4
): number {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const innerW = Math.max(1, width - inset * 2);
  const innerH = Math.max(1, height - inset * 2);

  if (cos < 1e-6) return innerH;
  if (sin < 1e-6) return innerW;
  return Math.min(innerW / cos, innerH / sin);
}

export function lineFromAngleInRect(
  width: number,
  height: number,
  angleDeg: number,
  inset = 4
): DividerLineVector {
  const cx = width / 2;
  const cy = height / 2;
  const len = maxLineLengthInRect(width, height, angleDeg, inset);
  const half = len / 2;
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * half;
  const dy = Math.sin(rad) * half;
  return { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy };
}

export function resolveDividerLine(band: ReportBand, rect: Rect): DividerLineVector {
  if (band.dividerLine) return band.dividerLine;
  return lineFromAngleInRect(rect.width, rect.height, band.dividerAngle ?? 0);
}

export function defaultDividerLine(rect: Rect): DividerLineVector {
  return lineFromAngleInRect(rect.width, rect.height, 0);
}

export function setLineAnglePreservingCenter(
  line: DividerLineVector,
  angleDeg: number
): DividerLineVector {
  const cx = (line.x1 + line.x2) / 2;
  const cy = (line.y1 + line.y2) / 2;
  const len = Math.max(1, lineLength(line));
  const half = len / 2;
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * half;
  const dy = Math.sin(rad) * half;
  return { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy };
}

export function fitBandRectToLine(
  bandRect: Rect,
  line: DividerLineVector,
  thickness: number,
  padding = DIVIDER_HANDLE_PADDING
): { bandRect: Rect; line: DividerLineVector } {
  const pad = padding + Math.ceil(thickness / 2);
  const minX = Math.min(line.x1, line.x2) - pad;
  const minY = Math.min(line.y1, line.y2) - pad;
  const maxX = Math.max(line.x1, line.x2) + pad;
  const maxY = Math.max(line.y1, line.y2) + pad;

  const width = Math.max(DIVIDER_MIN_WIDTH, maxX - minX);
  const height = Math.max(DIVIDER_MIN_HEIGHT, maxY - minY);

  return {
    bandRect: {
      x: bandRect.x + minX,
      y: bandRect.y + minY,
      width,
      height,
    },
    line: {
      x1: line.x1 - minX,
      y1: line.y1 - minY,
      x2: line.x2 - minX,
      y2: line.y2 - minY,
    },
  };
}

export function applyDividerAngleUpdate(
  band: ReportBand,
  rect: Rect,
  angleDeg: number
): Partial<ReportBand> {
  const line = resolveDividerLine(band, rect);
  const rotated = setLineAnglePreservingCenter(line, angleDeg);
  const fitted = fitBandRectToLine(rect, rotated, band.dividerThickness ?? 1);
  return {
    dividerLine: fitted.line,
    dividerAngle: lineAngleDegrees(fitted.line),
    bandRect: fitted.bandRect,
    dividerRect: fitted.bandRect,
    height: fitted.bandRect.height,
  };
}

/** Apenas translada a banda Linha — preserva dividerLine local. */
export function applyDividerPositionUpdate(rect: Rect): Partial<ReportBand> {
  return {
    bandRect: { ...rect },
    dividerRect: { ...rect },
    height: rect.height,
  };
}

export function applyDividerLineUpdate(
  band: ReportBand,
  rect: Rect,
  line: DividerLineVector,
  thickness?: number
): Partial<ReportBand> {
  const t = thickness ?? band.dividerThickness ?? 1;
  const fitted = fitBandRectToLine(rect, line, t);
  return {
    dividerLine: fitted.line,
    dividerAngle: lineAngleDegrees(fitted.line),
    bandRect: fitted.bandRect,
    dividerRect: fitted.bandRect,
    height: fitted.bandRect.height,
  };
}

export function snapLineAngle(angleDeg: number, step = 45): number {
  return normalizeDividerAngle(Math.round(angleDeg / step) * step);
}

/** Ponto do handle de rotação: perpendicular ao centro da linha */
export function rotationHandlePosition(
  line: DividerLineVector,
  offset = 18
): { x: number; y: number } {
  const center = lineCenter(line);
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return { x: center.x + nx * offset, y: center.y + ny * offset };
}

export function angleFromCenterToPoint(
  center: { x: number; y: number },
  point: { x: number; y: number }
): number {
  return normalizeDividerAngle(
    (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI
  );
}
