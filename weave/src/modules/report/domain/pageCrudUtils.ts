import { createId } from '../../../shared/domain/id';
import type { ReportBand } from '../../band/domain';
import type { ReportComponent } from '../../components/common/domain';
import type { ReportDefinition } from './report';
import {
  type ReportPage,
  BUILTIN_PAGE_PRESET_CATALOG,
  DEFAULT_PAGE_PRESET_ID,
  presetDimensionsToPx,
  type PagePresetCatalog,
} from '../../page/domain';
import { replaceReportPage } from './reportQueries';

function cloneBandWithNewIds(
  band: ReportBand,
  allComponents: Record<string, ReportComponent>
): { band: ReportBand; components: Record<string, ReportComponent> } {
  const newBandId = createId();
  const clone = JSON.parse(JSON.stringify(band)) as ReportBand;
  clone.id = newBandId;

  if (clone.dataTable?.columns) {
    clone.dataTable.columns = clone.dataTable.columns.map((col) => ({
      ...col,
      id: createId(),
    }));
  }

  const components: Record<string, ReportComponent> = {};
  const newCompIds: string[] = [];

  for (const compId of band.components) {
    const comp = allComponents[compId];
    if (!comp) continue;
    const source = JSON.parse(JSON.stringify(comp)) as ReportComponent;
    const newCompId = createId();
    source.id = newCompId;
    source.parentId = newBandId;
    components[newCompId] = source;
    newCompIds.push(newCompId);
  }

  clone.components = newCompIds;
  return { band: clone, components };
}

export function createBlankReportPage(
  report: ReportDefinition,
  options?: { name?: string; copyFromPageId?: string },
  catalog: PagePresetCatalog = BUILTIN_PAGE_PRESET_CATALOG
): { page: ReportPage; report: ReportDefinition } {
  const source =
    options?.copyFromPageId != null
      ? report.pages.find((p) => p.id === options.copyFromPageId)
      : report.pages[0];

  const preset = catalog.byId[source?.presetId ?? DEFAULT_PAGE_PRESET_ID];
  const dims = preset
    ? presetDimensionsToPx(preset)
    : {
        width: source?.width ?? 794,
        height: source?.height ?? 1123,
        margins: source?.margins ?? { top: 20, right: 20, bottom: 20, left: 20 },
      };

  const pageIndex = report.pages.length + 1;
  const page: ReportPage = {
    id: createId(),
    name: options?.name ?? `Página ${pageIndex}`,
    presetId: source?.presetId ?? DEFAULT_PAGE_PRESET_ID,
    profile: source?.profile ?? 'document',
    sizeUnit: source?.sizeUnit ?? 'cm',
    width: dims.width,
    height: dims.height,
    margins: { ...dims.margins },
    bands: [],
    dividers: [],
  };

  return {
    page,
    report: { ...report, pages: [...report.pages, page] },
  };
}

export function duplicateReportPage(
  report: ReportDefinition,
  pageId: string
): { report: ReportDefinition; newPageId: string } | null {
  const sourcePage = report.pages.find((p) => p.id === pageId);
  if (!sourcePage) return null;

  const newPageId = createId();
  const bandIdMap = new Map<string, string>();
  const newBands: Record<string, ReportBand> = { ...report.bands };
  const newComponents: Record<string, ReportComponent> = { ...report.components };

  const newBandOrder: string[] = [];
  const newDividers: string[] = [];

  for (const bandId of sourcePage.bands) {
    const band = report.bands[bandId];
    if (!band) continue;
    const { band: cloned, components } = cloneBandWithNewIds(band, report.components);
    bandIdMap.set(bandId, cloned.id);
    newBands[cloned.id] = cloned;
    Object.assign(newComponents, components);
    newBandOrder.push(cloned.id);
  }

  for (const bandId of sourcePage.dividers ?? []) {
    const band = report.bands[bandId];
    if (!band) continue;
    const { band: cloned, components } = cloneBandWithNewIds(band, report.components);
    bandIdMap.set(bandId, cloned.id);
    newBands[cloned.id] = cloned;
    Object.assign(newComponents, components);
    newDividers.push(cloned.id);
  }

  const newPage: ReportPage = {
    ...JSON.parse(JSON.stringify(sourcePage)) as ReportPage,
    id: newPageId,
    name: `${sourcePage.name} (cópia)`,
    bands: newBandOrder,
    dividers: newDividers,
  };

  return {
    newPageId,
    report: {
      ...report,
      bands: newBands,
      components: newComponents,
      pages: [...report.pages, newPage],
    },
  };
}

export function removeReportPage(
  report: ReportDefinition,
  pageId: string
): ReportDefinition | null {
  if (report.pages.length <= 1) return null;

  const page = report.pages.find((p) => p.id === pageId);
  if (!page) return null;

  const bandIds = new Set([...page.bands, ...(page.dividers ?? [])]);
  const nextBands = { ...report.bands };
  const nextComponents = { ...report.components };

  for (const bandId of bandIds) {
    const band = nextBands[bandId];
    if (!band) continue;
    for (const compId of band.components) {
      delete nextComponents[compId];
    }
    delete nextBands[bandId];
  }

  return {
    ...report,
    bands: nextBands,
    components: nextComponents,
    pages: report.pages.filter((p) => p.id !== pageId),
  };
}

export function renameReportPage(
  report: ReportDefinition,
  pageId: string,
  name: string
): ReportDefinition {
  const trimmed = name.trim();
  if (!trimmed) return report;
  const page = report.pages.find((p) => p.id === pageId);
  if (!page) return report;
  return replaceReportPage(report, pageId, { ...page, name: trimmed });
}
