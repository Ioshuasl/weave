import type { Rect } from '../types/report';

export const DESIGNER_PAGE_CONTENT_ATTR = 'data-designer-page-content';

export function getDesignerPageContent(el: Element | null): HTMLElement | null {
  if (!el) return null;
  return el.closest(`[${DESIGNER_PAGE_CONTENT_ATTR}]`) as HTMLElement | null;
}

/** Fator de escala visual do conteúdo da página (zoom CSS ou transform). */
export function getDesignerPageScale(fromEl: Element | null, zoom: number): number {
  if (zoom !== 1) return zoom;

  const page = getDesignerPageContent(fromEl);
  if (!page) return zoom;

  const zoomHost = page.closest(
    '.canvas-zoom-stage, .preview-zoom-stage'
  ) as HTMLElement | null;
  const cssZoom = zoomHost ? parseFloat(zoomHost.style.zoom || '1') : 1;
  if (cssZoom !== 1 && Number.isFinite(cssZoom)) return cssZoom;

  const bounds = page.getBoundingClientRect();
  const layoutWidth = page.offsetWidth;
  if (layoutWidth > 0 && bounds.width > 0) {
    const ratio = bounds.width / layoutWidth;
    if (Math.abs(ratio - 1) > 0.01) return ratio;
  }

  return zoom;
}

/** Converte coordenadas do cliente para locais da banda usando o rect do store. */
export function clientToBandLocal(
  clientX: number,
  clientY: number,
  bandRect: Rect,
  fromEl: Element | null,
  zoom: number
): { x: number; y: number } {
  const page = getDesignerPageContent(fromEl);
  if (!page) return { x: 0, y: 0 };
  const bounds = page.getBoundingClientRect();
  const scale = getDesignerPageScale(fromEl, zoom);
  return {
    x: (clientX - bounds.left) / scale - bandRect.x,
    y: (clientY - bounds.top) / scale - bandRect.y,
  };
}

export interface PointerDragOptions {
  pointerId: number;
  captureTarget?: Element | null;
  onMove: (e: PointerEvent) => void;
  onEnd?: (e: PointerEvent) => void;
}

/** Arrasto com pointer — usa capture para não perder eventos ao sair do elemento. */
export function attachDocumentPointerDrag({
  pointerId,
  captureTarget,
  onMove,
  onEnd,
}: PointerDragOptions): () => void {
  const isActive = (e: PointerEvent) => e.pointerId === pointerId;
  const target = captureTarget ?? document.documentElement;

  const endDrag = (e: PointerEvent) => {
    if (!isActive(e)) return;
    detach();
    onEnd?.(e);
  };

  const move = (e: PointerEvent) => {
    if (!isActive(e)) return;
    e.preventDefault();
    onMove(e);
  };

  const detach = () => {
    target.removeEventListener('pointermove', move);
    target.removeEventListener('pointerup', endDrag);
    target.removeEventListener('pointercancel', endDrag);
    target.removeEventListener('lostpointercapture', endDrag);
    if (captureTarget?.hasPointerCapture?.(pointerId)) {
      captureTarget.releasePointerCapture(pointerId);
    }
  };

  try {
    captureTarget?.setPointerCapture?.(pointerId);
  } catch {
    // Alguns elementos (ex.: botão desabilitado) podem falhar — segue sem capture.
  }

  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', endDrag);
  target.addEventListener('pointercancel', endDrag);
  target.addEventListener('lostpointercapture', endDrag);

  return detach;
}

export function screenDeltaToPageDelta(
  deltaX: number,
  deltaY: number,
  fromEl: Element | null,
  zoom: number
): { dx: number; dy: number } {
  const scale = getDesignerPageScale(fromEl, zoom);
  return { dx: deltaX / scale, dy: deltaY / scale };
}

export function translateBandRect(rect: Rect, dx: number, dy: number): Rect {
  return { ...rect, x: rect.x + dx, y: rect.y + dy };
}

export function isVectorLineHandle(target: EventTarget | null): boolean {
  return Boolean((target as HTMLElement | null)?.closest('.vector-line-handle'));
}
