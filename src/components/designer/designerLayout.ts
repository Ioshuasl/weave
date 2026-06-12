/** Breakpoints do designer (px) — ver briefing-responsividade-notebook */
export const DESIGNER_BREAKPOINT_LG = 1280;
export const DESIGNER_BREAKPOINT_XL = 1440;

export const COMPACT_LAYOUT_MEDIA_QUERY = '(max-width: 1279px)';

/** Aviso de viewport estreita — tablet portrait etc. */
export const NARROW_VIEWPORT_MEDIA_QUERY = '(max-width: 1023px)';

/** Sidebar colapsada (icon rail) — Fase R2 */
export const SIDEBAR_RAIL_CLASS = 'w-12 shrink-0 max-w-12 min-w-12';

/** Sidebar: 200px abaixo de 1440px, 240px (w-60) em desktop largo */
export const SIDEBAR_WIDTH_CLASS =
  'w-[200px] shrink-0 max-w-[200px] min-w-[200px] min-[1440px]:w-60 min-[1440px]:max-w-60 min-[1440px]:min-w-60';

/** Coluna direita: 240px (w-60) / 288px (w-72) em desktop largo */
export const PROPERTIES_PANEL_COLUMN_CLASS =
  'w-60 shrink-0 max-w-60 min-w-60 min-[1440px]:w-72 min-[1440px]:max-w-72 min-[1440px]:min-w-72';

/** Padding horizontal da área de scroll do canvas (total esq+dir em px) */
export const CANVAS_PADDING_X_COMPACT = 48;
export const CANVAS_PADDING_X_DEFAULT = 96;

export const CANVAS_SCROLL_PADDING_CLASS = 'p-6 min-[1440px]:p-12';

const ZOOM_MIN = 0.25;

export function getCanvasHorizontalPadding(viewportWidth: number): number {
  return viewportWidth >= DESIGNER_BREAKPOINT_XL
    ? CANVAS_PADDING_X_DEFAULT
    : CANVAS_PADDING_X_COMPACT;
}

/** Zoom para caber a folha na largura visível do canvas (máx. 100%) */
export function computeFitToWidthZoom(
  viewportWidth: number,
  pageWidth: number,
  horizontalPadding = CANVAS_PADDING_X_DEFAULT
): number {
  if (viewportWidth <= 0 || pageWidth <= 0) return 1;
  const available = viewportWidth - horizontalPadding;
  if (available >= pageWidth) return 1;
  const zoom = available / pageWidth;
  return Math.min(1, Math.max(ZOOM_MIN, Math.round(zoom * 1000) / 1000));
}
