import { createId } from '../../../shared/domain/id';
import { type ReportBand, getBandRect } from '../../band/domain';
import type { ReportComponent } from '../../components/common/domain';
import { type ReportDefinition, getReportPage } from '../../report/domain';
import { clampRectToPage } from '../../page/domain';

export const DUPLICATE_OFFSET = 12;

export function offsetComponentRect(
  rect: { x: number; y: number; width: number; height: number },
  bandWidth: number,
  bandHeight: number,
  offset = DUPLICATE_OFFSET
) {
  return {
    ...rect,
    x: Math.max(0, Math.min(rect.x + offset, Math.max(0, bandWidth - rect.width))),
    y: Math.max(0, Math.min(rect.y + offset, Math.max(0, bandHeight - rect.height))),
  };
}

function cloneBandForDuplicate(band: ReportBand, newBandId: string): ReportBand {
  const clone = JSON.parse(JSON.stringify(band)) as ReportBand;
  clone.id = newBandId;

  if (clone.dataTable?.columns) {
    clone.dataTable.columns = clone.dataTable.columns.map((col) => ({
      ...col,
      id: createId(),
    }));
  }

  clone.components = [];
  return clone;
}

function cloneComponentForDuplicate(
  comp: ReportComponent,
  newCompId: string,
  newParentId: string,
  bandWidth: number,
  bandHeight: number
): ReportComponent {
  const clone = JSON.parse(JSON.stringify(comp)) as ReportComponent;
  clone.id = newCompId;
  clone.parentId = newParentId;
  clone.rect = offsetComponentRect(comp.rect, bandWidth, bandHeight);
  return clone;
}

export function buildBandDuplicate(
  report: ReportDefinition,
  bandId: string,
  pageId?: string | null
): { report: ReportDefinition; newBandId: string } | null {
  const band = report.bands[bandId];
  if (!band) return null;

  const page = getReportPage(report, pageId);
  if (!page) return null;
  const sourceRect = getBandRect(band, page);
  const offsetRect = clampRectToPage(
    {
      ...sourceRect,
      x: sourceRect.x + DUPLICATE_OFFSET,
      y: sourceRect.y + DUPLICATE_OFFSET,
    },
    page
  );

  const newBandId = createId();
  const newBand = cloneBandForDuplicate(band, newBandId);
  newBand.height = offsetRect.height;
  newBand.bandRect = offsetRect;
  if (newBand.type === 'divider') {
    newBand.dividerRect = offsetRect;
  }

  const newComponents = { ...report.components };
  const newCompIds: string[] = [];

  for (const compId of band.components) {
    const comp = report.components[compId];
    if (!comp) continue;
    const newCompId = createId();
    newCompIds.push(newCompId);
    newComponents[newCompId] = cloneComponentForDuplicate(
      comp,
      newCompId,
      newBandId,
      offsetRect.width,
      offsetRect.height
    );
  }

  newBand.components = newCompIds;

  const isDivider = band.type === 'divider';
  const dividers = page.dividers ?? [];

  const nextPage = {
    ...page,
    bands: isDivider ? page.bands : [...page.bands, newBandId],
    dividers: isDivider ? [...dividers, newBandId] : dividers,
  };

  return {
    newBandId,
    report: {
      ...report,
      bands: { ...report.bands, [newBandId]: newBand },
      components: newComponents,
      pages: report.pages.map((p) => (p.id === page.id ? nextPage : p)),
    },
  };
}

export function buildComponentDuplicate(
  report: ReportDefinition,
  componentId: string,
  pageId?: string | null
): { report: ReportDefinition; newComponentId: string } | null {
  const comp = report.components[componentId];
  if (!comp) return null;

  const band = report.bands[comp.parentId];
  if (!band) return null;

  const page = getReportPage(report, pageId);
  if (!page) return null;
  const bandRect = getBandRect(band, page);
  const newCompId = createId();
  const newComp = cloneComponentForDuplicate(
    comp,
    newCompId,
    comp.parentId,
    bandRect.width,
    bandRect.height
  );

  return {
    newComponentId: newCompId,
    report: {
      ...report,
      components: { ...report.components, [newCompId]: newComp },
      bands: {
        ...report.bands,
        [comp.parentId]: {
          ...band,
          components: [...band.components, newCompId],
        },
      },
    },
  };
}
