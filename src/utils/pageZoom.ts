export const PAGE_ZOOM_MIN = 0.25;
export const PAGE_ZOOM_MAX = 2;
export const PAGE_ZOOM_STEP = 0.1;
export const PAGE_WHEEL_ZOOM_SENSITIVITY = 0.001;
export const PAGE_WHEEL_COMMIT_MS = 120;

export const clampPageZoom = (value: number) =>
  Math.min(PAGE_ZOOM_MAX, Math.max(PAGE_ZOOM_MIN, Math.round(value * 1000) / 1000));

let cssZoomSupported: boolean | null = null;

/** `zoom` refaz layout e mantém texto nítido; `transform: scale` borra ao ampliar. */
export function isCssZoomSupported(): boolean {
  if (cssZoomSupported === null) {
    cssZoomSupported =
      typeof CSS !== 'undefined' && CSS.supports('zoom', '1');
  }
  return cssZoomSupported;
}

export function getScaledContentSize(
  naturalWidth: number,
  naturalHeight: number,
  zoom: number
): { width: number; height: number } {
  return {
    width: Math.ceil(naturalWidth * zoom),
    height: Math.ceil(naturalHeight * zoom),
  };
}

export function applyPageZoomLayout(
  spacerEl: HTMLElement | null,
  contentEl: HTMLElement | null,
  zoom: number,
  naturalWidth: number,
  naturalHeight: number
) {
  if (!spacerEl || !contentEl || naturalWidth <= 0 || naturalHeight <= 0) return;

  const scaled = getScaledContentSize(naturalWidth, naturalHeight, zoom);
  spacerEl.style.width = `${scaled.width}px`;
  spacerEl.style.height = `${scaled.height}px`;

  contentEl.style.width = `${naturalWidth}px`;
  contentEl.style.height = `${naturalHeight}px`;
  contentEl.style.transform = '';
  contentEl.style.transformOrigin = '';
  contentEl.style.willChange = '';

  if (zoom === 1) {
    contentEl.style.zoom = '';
    return;
  }

  if (isCssZoomSupported()) {
    contentEl.style.zoom = String(zoom);
    return;
  }

  contentEl.style.transformOrigin = 'top left';
  contentEl.style.transform = `scale(${zoom})`;
  contentEl.style.willChange = 'transform';
}

/** Altura/largura de layout sem o fator de zoom visual (para spacer). */
export function getUnzoomedScrollSize(
  el: HTMLElement,
  zoom: number
): { width: number; height: number } {
  const z = zoom > 0 ? zoom : 1;
  return {
    width: el.scrollWidth / z,
    height: el.scrollHeight / z,
  };
}

export function compensateScrollForZoom(
  scrollEl: HTMLElement | null,
  focalX: number,
  focalY: number,
  oldZoom: number,
  newZoom: number
) {
  if (!scrollEl || oldZoom === newZoom || oldZoom <= 0) return;
  const ratio = newZoom / oldZoom;
  scrollEl.scrollLeft = (scrollEl.scrollLeft + focalX) * ratio - focalX;
  scrollEl.scrollTop = (scrollEl.scrollTop + focalY) * ratio - focalY;
}

export function getWheelFocalInScroll(
  scrollEl: HTMLElement,
  clientX: number,
  clientY: number,
  spacerEl: HTMLElement
): { focalX: number; focalY: number } {
  const scrollRect = scrollEl.getBoundingClientRect();
  return {
    focalX: clientX - scrollRect.left + scrollEl.scrollLeft - spacerEl.offsetLeft,
    focalY: clientY - scrollRect.top + scrollEl.scrollTop - spacerEl.offsetTop,
  };
}

export function getViewportCenterFocal(
  scrollEl: HTMLElement,
  spacerEl: HTMLElement
): { focalX: number; focalY: number } {
  return {
    focalX: scrollEl.scrollLeft + scrollEl.clientWidth / 2 - spacerEl.offsetLeft,
    focalY: scrollEl.scrollTop + scrollEl.clientHeight / 2 - spacerEl.offsetTop,
  };
}

/** @deprecated Use applyPageZoomLayout with spacer + content refs */
export function applyPageZoomTransform(
  el: HTMLElement | null,
  zoom: number,
  origin = 'top center'
) {
  if (!el) return;
  el.style.transformOrigin = origin;
  if (zoom === 1) {
    el.style.transform = '';
    el.style.willChange = '';
    el.style.zoom = '';
  } else if (isCssZoomSupported()) {
    el.style.transform = '';
    el.style.zoom = String(zoom);
  } else {
    el.style.transform = `scale(${zoom})`;
    el.style.willChange = 'transform';
  }
}
