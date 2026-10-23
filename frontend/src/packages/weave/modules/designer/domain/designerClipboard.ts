import { createId } from '../../../shared/domain/id';
import { type ReportBand, isTableDataBand, getBandRect } from '../../band/domain';
import { getPageContentSize } from '../../page/domain';
import { type ReportDefinition, getReportPage } from '../../report/domain';
import { DUPLICATE_OFFSET } from './designerDuplicate';
import type { ReportComponent } from '../../components/common/domain';

export interface ClipboardComponentPayload {
  type: ReportComponent['type'];
  name: string;
  rect: ReportComponent['rect'];
  content: string;
  style: ReportComponent['style'];
  textFormat?: ReportComponent['textFormat'];
  tableProps?: ReportComponent['tableProps'];
  chartProps?: ReportComponent['chartProps'];
  imageProps?: ReportComponent['imageProps'];
  textProps?: ReportComponent['textProps'];
  qrProps?: ReportComponent['qrProps'];
  /** Posição na folha no momento da cópia (para colar como elemento solto, mesmo após recortar) */
  pageX?: number;
  pageY?: number;
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
    imageProps: comp.imageProps,
    textProps: comp.textProps,
    qrProps: comp.qrProps,
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

function clipboardItemToComponent(
  item: ClipboardComponentPayload,
  id: string,
  parentId: string,
  rect: ReportComponent['rect']
): ReportComponent {
  return {
    id,
    parentId,
    type: item.type,
    name: item.name,
    content: item.content,
    style: { ...item.style },
    rect,
    ...(item.textFormat ? { textFormat: item.textFormat } : {}),
    ...(item.tableProps ? { tableProps: JSON.parse(JSON.stringify(item.tableProps)) } : {}),
    ...(item.chartProps ? { chartProps: JSON.parse(JSON.stringify(item.chartProps)) } : {}),
    ...(item.imageProps ? { imageProps: JSON.parse(JSON.stringify(item.imageProps)) } : {}),
    ...(item.textProps ? { textProps: JSON.parse(JSON.stringify(item.textProps)) } : {}),
    ...(item.qrProps ? { qrProps: JSON.parse(JSON.stringify(item.qrProps)) } : {}),
  };
}

/**
 * Colar sem bloco de destino (nada selecionado ou elemento solto selecionado): os itens viram
 * elementos soltos na posição original + deslocamento. Cria uma banda de elemento do tamanho da
 * folha com todos os itens; a normalização (`normalizeElementBands`) separa um por banda.
 */
export function buildLoosePasteFromClipboard(
  report: ReportDefinition,
  clipboard: DesignerClipboard,
  pageId: string | null
): { report: ReportDefinition; newComponentIds: string[] } | null {
  const page = getReportPage(report, pageId);
  if (!page || clipboard.items.length === 0) return null;

  const content = getPageContentSize(page);
  const bandId = createId();
  const components = { ...report.components };
  const newCompIds = clipboard.items.map((item) => {
    const id = createId();
    components[id] = clipboardItemToComponent(item, id, bandId, {
      ...item.rect,
      x: Math.min((item.pageX ?? 0) + DUPLICATE_OFFSET, Math.max(0, content.width - item.rect.width)),
      y: Math.min((item.pageY ?? 0) + DUPLICATE_OFFSET, Math.max(0, content.height - item.rect.height)),
    });
    return id;
  });

  const band: ReportBand = {
    id: bandId,
    type: 'reportTitle',
    name: 'Elemento',
    element: true,
    height: content.height,
    bandRect: { x: 0, y: 0, width: content.width, height: content.height },
    components: newCompIds,
  };

  return {
    newComponentIds: newCompIds,
    report: {
      ...report,
      components,
      bands: { ...report.bands, [bandId]: band },
      pages: report.pages.map((p) => (p.id === page.id ? { ...p, bands: [...p.bands, bandId] } : p)),
    },
  };
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
  // Colar com um elemento solto selecionado: cria elementos deslocados na folha (normalização separa)
  const sameBand = clipboard.sourceBandId === targetBandId || Boolean(targetBand.element);
  const content = getPageContentSize(page);
  const limitWidth = targetBand.element ? content.width - bandRect.x : bandRect.width;
  const limitHeight = targetBand.element ? content.height - bandRect.y : bandRect.height;
  const newComponents = { ...report.components };
  const newCompIds: string[] = [];

  for (const item of clipboard.items) {
    const newCompId = createId();
    newCompIds.push(newCompId);
    newComponents[newCompId] = clipboardItemToComponent(
      item,
      newCompId,
      targetBandId,
      resolveRectForPaste(item.rect, limitWidth, limitHeight, sameBand)
    );
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
