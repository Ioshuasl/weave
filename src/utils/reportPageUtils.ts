import type { ReportBand, ReportDefinition, ReportPage } from '../types/report';
import type { Rect } from '../types/report';

export function getPageContentSize(page: ReportPage) {
  return {
    width: page.width - page.margins.left - page.margins.right,
    height: page.height - page.margins.top - page.margins.bottom,
  };
}

export function resolveActivePageId(
  report: ReportDefinition,
  activePageId?: string | null
): string {
  if (activePageId && report.pages.some((page) => page.id === activePageId)) {
    return activePageId;
  }
  return report.pages[0]?.id ?? '';
}

export function getReportPage(
  report: ReportDefinition,
  pageId?: string | null
): ReportPage | null {
  const id = resolveActivePageId(report, pageId);
  return report.pages.find((page) => page.id === id) ?? null;
}

export function findPageIdForBand(
  report: ReportDefinition,
  bandId: string
): string | null {
  for (const page of report.pages) {
    if (page.bands.includes(bandId) || (page.dividers ?? []).includes(bandId)) {
      return page.id;
    }
  }
  return null;
}

export function findPageIdForComponent(
  report: ReportDefinition,
  componentId: string
): string | null {
  const component = report.components[componentId];
  if (!component) return null;
  return findPageIdForBand(report, component.parentId);
}

export function replaceReportPage(
  report: ReportDefinition,
  pageId: string,
  nextPage: ReportPage
): ReportDefinition {
  return {
    ...report,
    pages: report.pages.map((page) => (page.id === pageId ? nextPage : page)),
  };
}

export function patchReportPage(
  report: ReportDefinition,
  pageId: string,
  patch: Partial<ReportPage>
): ReportDefinition {
  const page = report.pages.find((p) => p.id === pageId);
  if (!page) return report;
  return replaceReportPage(report, pageId, { ...page, ...patch });
}

/** Retângulo da banda na área útil da página */
export function getBandRect(band: ReportBand, page: ReportPage): Rect {
  if (band.type === 'divider' && band.dividerRect) return band.dividerRect;
  if (band.bandRect) return band.bandRect;

  const { width } = getPageContentSize(page);
  return {
    x: 8,
    y: 8,
    width: Math.max(80, width - 16),
    height: band.height || 40,
  };
}

export function getDefaultBandRect(
  page: ReportPage,
  height: number,
  stackIndex: number
): Rect {
  const { width } = getPageContentSize(page);
  const cascade = (stackIndex % 12) * 14;
  return {
    x: 16 + cascade,
    y: 16 + cascade,
    width: Math.max(120, width - 32 - cascade),
    height,
  };
}

/** Ordem de empilhamento (índice baixo = atrás, alto = na frente) */
export function getAllPlacedBandIds(
  page: ReportPage,
  bands: Record<string, ReportBand>
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const id of page.bands) {
    if (bands[id] && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  for (const id of page.dividers ?? []) {
    if (bands[id] && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  return ordered;
}

export function getBandZIndex(
  bandId: string,
  page: ReportPage,
  selectedId: string | null
): number {
  const bandIndex = page.bands.indexOf(bandId);
  const dividerIndex = (page.dividers ?? []).indexOf(bandId);
  const stackIndex = bandIndex >= 0 ? bandIndex : dividerIndex;
  const order = stackIndex >= 0 ? stackIndex : 0;
  const isActive = selectedId === bandId;
  return isActive ? 100 + order : 10 + order;
}

/** @deprecated use getBandRect */
export function getDividerRect(band: ReportBand, page: ReportPage): Rect {
  return getBandRect(band, page);
}

export function clampRectToPage(rect: Rect, page: ReportPage): Rect {
  const { width: contentWidth, height: contentHeight } = getPageContentSize(page);
  return {
    ...rect,
    x: Math.max(0, Math.min(rect.x, Math.max(0, contentWidth - rect.width))),
    y: Math.max(0, Math.min(rect.y, Math.max(0, contentHeight - rect.height))),
  };
}

export function getDefaultDividerRect(page: ReportPage): Rect {
  const { width, height } = getPageContentSize(page);
  return {
    x: Math.round(width * 0.08),
    y: Math.round(height * 0.35),
    width: Math.round(width * 0.84),
    height: 24,
  };
}
