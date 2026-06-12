import type { Rect, ReportBand, ReportComponent, ReportDefinition, ReportPage } from '../types/report';
import {
  BUILTIN_PAGE_PRESET_CATALOG,
  CUSTOM_PAGE_PRESET_ID,
  getPagePreset,
  presetDimensionsToPx,
  type PagePresetCatalog,
  type PagePresetDefinition,
} from './pagePresets';

function scaleRect(rect: Rect, scaleX: number, scaleY: number): Rect {
  return {
    x: Math.round(rect.x * scaleX),
    y: Math.round(rect.y * scaleY),
    width: Math.max(1, Math.round(rect.width * scaleX)),
    height: Math.max(1, Math.round(rect.height * scaleY)),
  };
}

function scaleBand(
  band: ReportBand,
  scaleX: number,
  scaleY: number
): ReportBand {
  const next: ReportBand = { ...band };

  if (band.bandRect) {
    next.bandRect = scaleRect(band.bandRect, scaleX, scaleY);
  }
  if (band.dividerRect) {
    next.dividerRect = scaleRect(band.dividerRect, scaleX, scaleY);
  }
  if (band.dividerLine) {
    next.dividerLine = {
      x1: Math.round(band.dividerLine.x1 * scaleX),
      y1: Math.round(band.dividerLine.y1 * scaleY),
      x2: Math.round(band.dividerLine.x2 * scaleX),
      y2: Math.round(band.dividerLine.y2 * scaleY),
    };
  }
  if (band.height) {
    next.height = Math.max(1, Math.round(band.height * scaleY));
  }

  return next;
}

function scaleComponent(
  component: ReportComponent,
  scaleX: number,
  scaleY: number
): ReportComponent {
  return {
    ...component,
    rect: scaleRect(component.rect, scaleX, scaleY),
  };
}

function getPageBandIds(page: ReportPage): string[] {
  return [...page.bands, ...(page.dividers ?? [])];
}

/** Redimensiona a folha e escala bandas/componentes proporcionalmente */
export function resizeReportPage(
  report: ReportDefinition,
  pageId: string,
  nextPage: ReportPage
): ReportDefinition {
  const pageIndex = report.pages.findIndex((p) => p.id === pageId);
  if (pageIndex < 0) return report;

  const oldPage = report.pages[pageIndex];
  const scaleX = oldPage.width > 0 ? nextPage.width / oldPage.width : 1;
  const scaleY = oldPage.height > 0 ? nextPage.height / oldPage.height : 1;
  const shouldScale = scaleX !== 1 || scaleY !== 1;

  const bandIds = new Set(getPageBandIds(oldPage));
  const nextBands = { ...report.bands };
  const nextComponents = { ...report.components };

  if (shouldScale) {
    for (const bandId of bandIds) {
      const band = nextBands[bandId];
      if (band) nextBands[bandId] = scaleBand(band, scaleX, scaleY);
    }

    for (const [componentId, component] of Object.entries(report.components)) {
      if (!bandIds.has(component.parentId)) continue;
      nextComponents[componentId] = scaleComponent(component, scaleX, scaleY);
    }
  }

  const pages = [...report.pages];
  pages[pageIndex] = nextPage;

  return {
    ...report,
    pages,
    bands: nextBands,
    components: nextComponents,
  };
}

export function buildPageFromPreset(
  page: ReportPage,
  preset: PagePresetDefinition
): ReportPage {
  const dims = presetDimensionsToPx(preset);
  return {
    ...page,
    presetId: preset.id,
    profile: preset.profile,
    width: dims.width,
    height: dims.height,
    margins: dims.margins,
  };
}

export function applyPresetToReport(
  report: ReportDefinition,
  pageId: string,
  presetId: string,
  catalog: PagePresetCatalog = BUILTIN_PAGE_PRESET_CATALOG
): ReportDefinition | null {
  const preset = getPagePreset(presetId, catalog);
  if (!preset) return null;

  const page = report.pages.find((p) => p.id === pageId);
  if (!page) return null;

  const nextPage = buildPageFromPreset(page, preset);
  return resizeReportPage(report, pageId, nextPage);
}

export function flipPageOrientationInReport(
  report: ReportDefinition,
  pageId: string,
  catalog: PagePresetCatalog = BUILTIN_PAGE_PRESET_CATALOG
): ReportDefinition | null {
  const pageIndex = report.pages.findIndex((p) => p.id === pageId);
  if (pageIndex < 0) return null;

  const page = report.pages[pageIndex];
  const pairId = getPagePreset(page.presetId, catalog)?.orientationPairId;

  if (pairId) {
    return applyPresetToReport(report, pageId, pairId, catalog);
  }

  const nextPage: ReportPage = {
    ...page,
    presetId: CUSTOM_PAGE_PRESET_ID,
    width: page.height,
    height: page.width,
  };

  return resizeReportPage(report, pageId, nextPage);
}

export function updateReportPage(
  report: ReportDefinition,
  pageId: string,
  patch: Partial<ReportPage>,
  options?: { scaleContent?: boolean }
): ReportDefinition {
  const pageIndex = report.pages.findIndex((p) => p.id === pageId);
  if (pageIndex < 0) return report;

  const oldPage = report.pages[pageIndex];
  const nextPage: ReportPage = { ...oldPage, ...patch };

  const sizeChanged =
    (patch.width !== undefined && patch.width !== oldPage.width) ||
    (patch.height !== undefined && patch.height !== oldPage.height);

  if (options?.scaleContent && sizeChanged) {
    return resizeReportPage(report, pageId, nextPage);
  }

  const pages = [...report.pages];
  pages[pageIndex] = nextPage;
  return { ...report, pages };
}
