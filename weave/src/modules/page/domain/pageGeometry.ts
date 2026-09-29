import type { ReportPage } from './page';
import type { Rect } from '../../../shared/domain/geometry';

export function getPageContentSize(page: ReportPage) {
  return {
    width: page.width - page.margins.left - page.margins.right,
    height: page.height - page.margins.top - page.margins.bottom,
  };
}

export function clampRectToPage(rect: Rect, page: ReportPage): Rect {
  const { width: contentWidth, height: contentHeight } = getPageContentSize(page);
  return {
    ...rect,
    x: Math.max(0, Math.min(rect.x, Math.max(0, contentWidth - rect.width))),
    y: Math.max(0, Math.min(rect.y, Math.max(0, contentHeight - rect.height))),
  };
}
