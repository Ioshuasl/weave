export const PAGE_ZOOM_MIN = 0.25;
export const PAGE_ZOOM_MAX = 2;
export const PAGE_ZOOM_STEP = 0.1;
export const PAGE_WHEEL_ZOOM_SENSITIVITY = 0.001;
export const PAGE_WHEEL_COMMIT_MS = 120;

export const clampPageZoom = (value: number) =>
  Math.min(PAGE_ZOOM_MAX, Math.max(PAGE_ZOOM_MIN, Math.round(value * 1000) / 1000));

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

/** Padding horizontal da área de scroll (total esq+dir em px) */
export const CANVAS_PADDING_X_COMPACT = 48;
export const CANVAS_PADDING_X_DEFAULT = 96;

/** Zoom para caber a folha na largura visível (máx. 100%) */
export function computeFitToWidthZoom(
  viewportWidth: number,
  pageWidth: number,
  horizontalPadding = CANVAS_PADDING_X_DEFAULT
): number {
  if (viewportWidth <= 0 || pageWidth <= 0) return 1;
  const available = viewportWidth - horizontalPadding;
  if (available >= pageWidth) return 1;
  const zoom = available / pageWidth;
  return Math.min(1, Math.max(PAGE_ZOOM_MIN, Math.round(zoom * 1000) / 1000));
}
