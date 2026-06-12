import type { ReportDefinition, ReportPage } from '../types/report';
import { getBandRect, getPageContentSize } from './reportPageUtils';

export const DESIGNER_SNAP_GRID = 5;
export const DESIGNER_SNAP_THRESHOLD = 6;

export interface SnapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapGuides {
  vertical: number[];
  horizontal: number[];
}

export interface SnapOptions {
  enabled?: boolean;
  shiftKey?: boolean;
  useGridFallback?: boolean;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuides;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.map((v) => Math.round(v * 100) / 100))].sort((a, b) => a - b);
}

function snapToGrid(value: number, grid = DESIGNER_SNAP_GRID): number {
  return Math.round(value / grid) * grid;
}

function snapOneAxis(
  start: number,
  size: number,
  targets: number[],
  threshold: number,
  useGrid: boolean
): { value: number; guides: number[] } {
  const left = start;
  const center = start + size / 2;
  const right = start + size;

  let bestDist = threshold + 1;
  let bestStart = start;
  const guides: number[] = [];

  const consider = (moving: number, resolveStart: (target: number) => number, target: number) => {
    const dist = Math.abs(moving - target);
    if (dist > threshold) return;

    if (dist < bestDist) {
      bestDist = dist;
      bestStart = resolveStart(target);
      guides.length = 0;
      guides.push(target);
      return;
    }

    if (dist === bestDist) {
      guides.push(target);
    }
  };

  for (const target of targets) {
    consider(left, (t) => t, target);
    consider(center, (t) => t - size / 2, target);
    consider(right, (t) => t - size, target);
  }

  if (guides.length > 0) {
    return { value: bestStart, guides: uniqueSorted(guides) };
  }

  if (useGrid) {
    const snapped = snapToGrid(start);
    return { value: snapped, guides: snapped !== start ? [snapped] : [] };
  }

  return { value: start, guides: [] };
}

/** Converte guias locais (ex.: dentro da banda) para coordenadas da página */
export function offsetSnapGuides(
  guides: SnapGuides,
  offsetX: number,
  offsetY: number
): SnapGuides {
  return {
    vertical: guides.vertical.map((x) => x + offsetX),
    horizontal: guides.horizontal.map((y) => y + offsetY),
  };
}

export function computeSnap(
  rect: SnapRect,
  verticalTargets: number[],
  horizontalTargets: number[],
  options: SnapOptions = {}
): SnapResult {
  const enabled = options.enabled !== false;
  const shiftKey = options.shiftKey === true;
  const useGrid = enabled && !shiftKey && options.useGridFallback !== false;

  if (!enabled || shiftKey) {
    return { x: rect.x, y: rect.y, guides: { vertical: [], horizontal: [] } };
  }

  const xSnap = snapOneAxis(rect.x, rect.width, verticalTargets, DESIGNER_SNAP_THRESHOLD, useGrid);
  const ySnap = snapOneAxis(rect.y, rect.height, horizontalTargets, DESIGNER_SNAP_THRESHOLD, useGrid);

  return {
    x: xSnap.value,
    y: ySnap.value,
    guides: {
      vertical: xSnap.guides,
      horizontal: ySnap.guides,
    },
  };
}

export function collectPageSnapTargets(page: ReportPage): {
  vertical: number[];
  horizontal: number[];
} {
  const { width, height } = getPageContentSize(page);
  return {
    vertical: uniqueSorted([0, width / 2, width]),
    horizontal: uniqueSorted([0, height / 2, height]),
  };
}

export function collectBandSnapTargets(
  report: ReportDefinition,
  page: ReportPage,
  excludeBandId: string
): { vertical: number[]; horizontal: number[] } {
  const pageTargets = collectPageSnapTargets(page);
  const vertical: number[] = [...pageTargets.vertical];
  const horizontal: number[] = [...pageTargets.horizontal];

  for (const [bandId, band] of Object.entries(report.bands)) {
    if (bandId === excludeBandId) continue;
    const rect = getBandRect(band, page);
    vertical.push(rect.x, rect.x + rect.width / 2, rect.x + rect.width);
    horizontal.push(rect.y, rect.y + rect.height / 2, rect.y + rect.height);
  }

  return {
    vertical: uniqueSorted(vertical),
    horizontal: uniqueSorted(horizontal),
  };
}

export function collectComponentSnapTargets(
  report: ReportDefinition,
  page: ReportPage,
  bandId: string,
  excludeComponentId: string
): { vertical: number[]; horizontal: number[] } {
  const band = report.bands[bandId];
  if (!band) {
    return { vertical: [], horizontal: [] };
  }

  const bandRect = getBandRect(band, page);
  const vertical: number[] = [0, bandRect.width / 2, bandRect.width];
  const horizontal: number[] = [0, bandRect.height / 2, bandRect.height];

  for (const compId of band.components) {
    if (compId === excludeComponentId) continue;
    const comp = report.components[compId];
    if (!comp) continue;
    const { x, y, width, height } = comp.rect;
    vertical.push(x, x + width / 2, x + width);
    horizontal.push(y, y + height / 2, y + height);
  }

  return {
    vertical: uniqueSorted(vertical),
    horizontal: uniqueSorted(horizontal),
  };
}
