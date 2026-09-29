import { DESIGNER_BREAKPOINT_XL } from '../../../shared/ui/breakpoints';
import { CANVAS_PADDING_X_DEFAULT, CANVAS_PADDING_X_COMPACT } from '../domain/pageZoom';

export function getCanvasHorizontalPadding(viewportWidth: number): number {
  return viewportWidth >= DESIGNER_BREAKPOINT_XL
    ? CANVAS_PADDING_X_DEFAULT
    : CANVAS_PADDING_X_COMPACT;
}
