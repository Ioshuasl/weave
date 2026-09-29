import type { Rect } from '../../../../shared/domain/geometry';
import type { ReportDefinition } from '../../../report/domain';
import type { ReportPage } from '../../../page/domain';
import { getListRowContentInset, isTableDataBand, getAllPlacedBandIds, getBandRect } from '../../../band/domain';
import { clientToPageContentPoint } from './designerDragDrop';

export type CanvasHitKind = 'component' | 'band';

export interface CanvasHit {
  id: string;
  kind: CanvasHitKind;
  area: number;
  z: number;
}

export const CANVAS_HIT_IGNORE_SELECTOR =
  '.band-toolbar, .no-drag, .vector-line-handle, [data-resize-handle]';

export function isCanvasHitIgnoredTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(CANVAS_HIT_IGNORE_SELECTOR));
}

function pointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.width && y <= rect.y + rect.height;
}

function sortHits(hits: CanvasHit[]): CanvasHit[] {
  return [...hits].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'component' ? -1 : 1;
    if (a.area !== b.area) return a.area - b.area;
    return b.z - a.z;
  });
}

export function collectCanvasHits(
  report: ReportDefinition,
  page: ReportPage,
  x: number,
  y: number,
  previewRects?: Record<string, { x: number; y: number }> | null
): CanvasHit[] {
  const hits: CanvasHit[] = [];
  const bandIds = getAllPlacedBandIds(page, report.bands);

  bandIds.forEach((bandId, bandOrder) => {
    const band = report.bands[bandId];
    if (!band) return;

    const bandRect = getBandRect(band, page);
    const bandPreview = previewRects?.[bandId];
    const origin = {
      x: bandPreview?.x ?? bandRect.x,
      y: bandPreview?.y ?? bandRect.y,
    };
    const placedBand: Rect = {
      ...bandRect,
      x: origin.x,
      y: origin.y,
    };

    if (pointInRect(x, y, placedBand)) {
      hits.push({
        id: bandId,
        kind: 'band',
        area: Math.max(1, placedBand.width * placedBand.height),
        z: bandOrder * 10_000,
      });
    }

    if (isTableDataBand(band)) return;

    const inset = getListRowContentInset(band);
    band.components.forEach((componentId, componentIndex) => {
      const component = report.components[componentId];
      if (!component) return;
      const preview = previewRects?.[componentId];
      const localX = preview?.x ?? component.rect.x;
      const localY = preview?.y ?? component.rect.y;
      const rect: Rect = {
        x: origin.x + inset + localX,
        y: origin.y + localY,
        width: component.rect.width,
        height: component.rect.height,
      };
      if (!pointInRect(x, y, rect)) return;
      hits.push({
        id: componentId,
        kind: 'component',
        area: Math.max(1, rect.width * rect.height),
        z: bandOrder * 10_000 + componentIndex + 1,
      });
    });
  });

  return hits;
}

export function pickCanvasHit(hits: CanvasHit[]): CanvasHit | null {
  return sortHits(hits)[0] ?? null;
}

export function cycleCanvasHit(hits: CanvasHit[], currentId: string | null): CanvasHit | null {
  const ordered = sortHits(hits);
  if (ordered.length === 0) return null;
  if (!currentId) return ordered[0];
  const index = ordered.findIndex((hit) => hit.id === currentId);
  if (index < 0) return ordered[0];
  return ordered[(index + 1) % ordered.length];
}

export function canvasHitIdFromEventTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const component = target.closest('[data-component-id]');
  if (component instanceof HTMLElement && component.dataset.componentId) {
    return component.dataset.componentId;
  }
  const band = target.closest('[data-band-id]');
  if (band instanceof HTMLElement && band.dataset.bandId) {
    return band.dataset.bandId;
  }
  return null;
}

export function collectCanvasHitsAtClient(
  clientX: number,
  clientY: number,
  zoom: number,
  report: ReportDefinition,
  page: ReportPage | null,
  previewRects?: Record<string, { x: number; y: number }> | null
): CanvasHit[] {
  if (!page) return [];
  const point = clientToPageContentPoint(clientX, clientY, zoom);
  if (!point) return [];
  return collectCanvasHits(report, page, point.x, point.y, previewRects);
}

export function pickCanvasHitAtClient(
  clientX: number,
  clientY: number,
  zoom: number,
  report: ReportDefinition,
  page: ReportPage | null,
  previewRects?: Record<string, { x: number; y: number }> | null
): CanvasHit | null {
  return pickCanvasHit(
    collectCanvasHitsAtClient(clientX, clientY, zoom, report, page, previewRects)
  );
}

export function resolveCanvasSelectionAtPointer(
  clientX: number,
  clientY: number,
  zoom: number,
  report: ReportDefinition,
  page: ReportPage | null,
  previewRects: Record<string, { x: number; y: number }> | null | undefined,
  options: {
    altKey?: boolean;
    primarySelectedId?: string | null;
    fallbackId: string;
  }
): { id: string; bringToFront: boolean } {
  const hits = collectCanvasHitsAtClient(
    clientX,
    clientY,
    zoom,
    report,
    page,
    previewRects
  );

  if (options.altKey) {
    const cycled = cycleCanvasHit(hits, options.primarySelectedId ?? null);
    return { id: cycled?.id ?? options.fallbackId, bringToFront: false };
  }

  return { id: pickCanvasHit(hits)?.id ?? options.fallbackId, bringToFront: true };
}


