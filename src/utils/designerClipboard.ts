import { v4 as uuidv4 } from 'uuid';
import type { ReportBand, ReportComponent, ReportDefinition } from '../types/report';
import { isTableDataBand } from './dataBandUtils';
import { DUPLICATE_OFFSET } from './designerDuplicate';
import { getBandRect } from './reportPageUtils';

export interface ClipboardComponentPayload {
  type: ReportComponent['type'];
  name: string;
  rect: ReportComponent['rect'];
  content: string;
  style: ReportComponent['style'];
  textFormat?: ReportComponent['textFormat'];
  tableProps?: ReportComponent['tableProps'];
  chartProps?: ReportComponent['chartProps'];
}

export interface DesignerClipboard {
  sourceBandId: string;
  items: ClipboardComponentPayload[];
}

export function canBandAcceptPastedComponents(band: ReportBand | null | undefined): boolean {
  if (!band) return false;
  if (band.type === 'divider') return false;
  if (isTableDataBand(band)) return false;
  return true;
}

export function componentToClipboardPayload(comp: ReportComponent): ClipboardComponentPayload {
  return JSON.parse(JSON.stringify({
    type: comp.type,
    name: comp.name,
    rect: comp.rect,
    content: comp.content,
    style: comp.style,
    textFormat: comp.textFormat,
    tableProps: comp.tableProps,
    chartProps: comp.chartProps,
  })) as ClipboardComponentPayload;
}

function resolveRectForPaste(
  rect: ReportComponent['rect'],
  bandWidth: number,
  bandHeight: number,
  sameBand: boolean
): ReportComponent['rect'] {
  const offset = sameBand ? DUPLICATE_OFFSET : 0;
  const width = rect.width;
  const height = rect.height;
  const x = Math.max(0, Math.min(rect.x + offset, Math.max(0, bandWidth - width)));
  const y = Math.max(0, Math.min(rect.y + offset, Math.max(0, bandHeight - height)));
  return { x, y, width, height };
}

export function resolvePasteTargetBandId(
  report: ReportDefinition,
  selectedId: string | null
): string | null {
  if (!selectedId) return null;

  const selectedBand = report.bands[selectedId];
  if (selectedBand && canBandAcceptPastedComponents(selectedBand)) {
    return selectedId;
  }

  const selectedComponent = report.components[selectedId];
  if (selectedComponent) {
    const parent = report.bands[selectedComponent.parentId];
    if (canBandAcceptPastedComponents(parent)) {
      return parent.id;
    }
  }

  return null;
}

export function buildPasteFromClipboard(
  report: ReportDefinition,
  clipboard: DesignerClipboard,
  targetBandId: string
): { report: ReportDefinition; newComponentIds: string[] } | null {
  const targetBand = report.bands[targetBandId];
  if (!targetBand || !canBandAcceptPastedComponents(targetBand)) return null;
  if (clipboard.items.length === 0) return null;

  const page = report.pages.find((p) => p.bands.includes(targetBandId)) ?? report.pages[0];
  const bandRect = getBandRect(targetBand, page);
  const sameBand = clipboard.sourceBandId === targetBandId;
  const newComponents = { ...report.components };
  const newCompIds: string[] = [];

  for (const item of clipboard.items) {
    const newCompId = uuidv4();
    newCompIds.push(newCompId);
    newComponents[newCompId] = {
      id: newCompId,
      parentId: targetBandId,
      type: item.type,
      name: item.name,
      content: item.content,
      style: { ...item.style },
      rect: resolveRectForPaste(item.rect, bandRect.width, bandRect.height, sameBand),
      ...(item.textFormat ? { textFormat: item.textFormat } : {}),
      ...(item.tableProps ? { tableProps: JSON.parse(JSON.stringify(item.tableProps)) } : {}),
      ...(item.chartProps ? { chartProps: JSON.parse(JSON.stringify(item.chartProps)) } : {}),
    };
  }

  return {
    newComponentIds: newCompIds,
    report: {
      ...report,
      components: newComponents,
      bands: {
        ...report.bands,
        [targetBandId]: {
          ...targetBand,
          components: [...targetBand.components, ...newCompIds],
        },
      },
    },
  };
}
