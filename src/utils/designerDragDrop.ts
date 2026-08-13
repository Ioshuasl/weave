import type { DragEvent } from 'react';
import type { BandType, ComponentType, ReportBand, ReportComponent, ReportPage } from '../types/report';
import { isTableDataBand } from './dataBandUtils';
import { clampRectToPage, getAllPlacedBandIds, getBandRect } from './reportPageUtils';
import { getDesignerPageScale } from './dividerBandInteraction';

export const DESIGNER_DRAG_MIME = 'application/json';

export type DesignerDragPayload =
  | { type: 'field'; content: string }
  | { type: 'band'; bandType: BandType }
  | { type: 'component'; componentType: ComponentType };

export function setDesignerDragData(e: DragEvent, payload: DesignerDragPayload) {
  e.dataTransfer.setData(DESIGNER_DRAG_MIME, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = 'copy';
}

export function readDesignerDragPayload(e: DragEvent): DesignerDragPayload | null {
  const raw = e.dataTransfer.getData(DESIGNER_DRAG_MIME);
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as DesignerDragPayload;
    if (
      payload?.type === 'field' ||
      payload?.type === 'band' ||
      payload?.type === 'component'
    ) {
      return payload;
    }
  } catch {
    return null;
  }
  return null;
}

export function acceptsDesignerDrop(payload: DesignerDragPayload | null): boolean {
  return payload !== null;
}

/** Verifica arrasto da sidebar durante dragEnter/dragOver (sem ler getData). */
export function hasDesignerDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes(DESIGNER_DRAG_MIME);
}

export function clientToLocalPoint(
  clientX: number,
  clientY: number,
  element: HTMLElement,
  zoom: number
): { x: number; y: number } {
  const bounds = element.getBoundingClientRect();
  return {
    x: (clientX - bounds.left) / zoom,
    y: (clientY - bounds.top) / zoom,
  };
}

export function getPageContentElement(): HTMLElement | null {
  return document.querySelector('[data-designer-page-content]');
}

export function clientToPageContentPoint(
  clientX: number,
  clientY: number,
  zoom: number
): { x: number; y: number } | null {
  const pageEl = getPageContentElement();
  if (!pageEl) return null;
  const scale = getDesignerPageScale(pageEl, zoom);
  return clientToLocalPoint(clientX, clientY, pageEl, scale);
}

export function findBandAtPagePoint(
  x: number,
  y: number,
  page: ReportPage,
  bands: Record<string, ReportBand>
): ReportBand | null {
  const ids = [...getAllPlacedBandIds(page, bands)].reverse();
  for (const id of ids) {
    const band = bands[id];
    if (!band || band.type === 'divider' || isTableDataBand(band)) continue;
    const rect = getBandRect(band, page);
    if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
      return band;
    }
  }
  return null;
}

export interface DesignerDropActions {
  addBand: (type: BandType, options?: { position?: { x: number; y: number } }) => void;
  addComponent: (
    bandId: string,
    type: ComponentType,
    initialProps?: Partial<ReportComponent>
  ) => void;
}

export interface BandSurfaceDropContext {
  bandId: string;
  zoom: number;
  rowHeight?: number;
  isTableLayout?: boolean;
}

export function handleBandSurfaceDrop(
  e: DragEvent,
  context: BandSurfaceDropContext,
  actions: DesignerDropActions
): boolean {
  const payload = readDesignerDragPayload(e);
  if (!payload) return false;

  e.preventDefault();
  e.stopPropagation();

  if (payload.type === 'band') {
    const point = clientToPageContentPoint(e.clientX, e.clientY, context.zoom);
    if (!point) return false;
    actions.addBand(payload.bandType, { position: point });
    return true;
  }

  if (context.isTableLayout) return false;

  const bounds = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - bounds.left) / context.zoom;
  const y = (e.clientY - bounds.top) / context.zoom;

  if (payload.type === 'field') {
    actions.addComponent(context.bandId, 'text', {
      rect: { x, y, width: 120, height: 24 },
      content: payload.content,
      style: { fontSize: '12px' },
    });
    return true;
  }

  if (payload.type === 'component') {
    actions.addComponent(context.bandId, payload.componentType, {
      rect: { x, y, width: 100, height: 20 },
    });
    return true;
  }

  return false;
}

export function handlePageContentDrop(
  e: DragEvent,
  context: {
    zoom: number;
    page: ReportPage;
    bands: Record<string, ReportBand>;
  },
  actions: DesignerDropActions
): boolean {
  const payload = readDesignerDragPayload(e);
  if (!payload) return false;

  e.preventDefault();
  e.stopPropagation();

  const point = clientToLocalPoint(
    e.clientX,
    e.clientY,
    e.currentTarget as HTMLElement,
    context.zoom
  );

  if (payload.type === 'band') {
    actions.addBand(payload.bandType, { position: point });
    return true;
  }

  if (payload.type === 'field') {
    const band = findBandAtPagePoint(point.x, point.y, context.page, context.bands);
    if (!band) return false;
    const bandRect = getBandRect(band, context.page);
    actions.addComponent(band.id, 'text', {
      rect: {
        x: point.x - bandRect.x,
        y: point.y - bandRect.y,
        width: 120,
        height: 24,
      },
      content: payload.content,
      style: { fontSize: '12px' },
    });
    return true;
  }

  if (payload.type === 'component') {
    const band = findBandAtPagePoint(point.x, point.y, context.page, context.bands);
    if (!band) return false;
    const bandRect = getBandRect(band, context.page);
    actions.addComponent(band.id, payload.componentType, {
      rect: {
        x: Math.max(0, point.x - bandRect.x),
        y: Math.max(0, point.y - bandRect.y),
        width: 100,
        height: 20,
      },
    });
    return true;
  }

  return false;
}
