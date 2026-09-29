import type { ReportDefinition } from './report';
import type { ReportPage } from '../../page/domain';

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
