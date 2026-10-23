import { type BandType, type ReportBand, isTableDataBand, isListDataBand, getAllPlacedBandIds, getBandRect } from '../../../band/domain';
import { type DataSourceCatalog, getDataSourceKind } from '../../../data-source/domain';
import { type ComponentType, type ReportComponent, getDefaultComponentSize } from '../../../components/common/domain';
import { type ReportPage } from '../../../page/domain';
import { getDesignerPageScale } from './bands/dividerBandInteraction';
import type { DragEvent } from 'react';

export const DESIGNER_DRAG_MIME = 'application/json';

export type DesignerDragPayload =
  | { type: 'field'; content: string }
  | { type: 'band'; bandType: BandType }
  | { type: 'component'; componentType: ComponentType };

export function setDesignerDragData(e: DragEvent, payload: DesignerDragPayload) {
  e.dataTransfer.setData(DESIGNER_DRAG_MIME, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = 'copy';
}

export function readDesignerDragPayload(e: DragEvent): DesignerDragPayload | null {
  const raw = e.dataTransfer.getData(DESIGNER_DRAG_MIME);
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as DesignerDragPayload;
    if (
      payload?.type === 'field' ||
      payload?.type === 'band' ||
      payload?.type === 'component'
    ) {
      return payload;
    }
  } catch {
    return null;
  }
  return null;
}

export function acceptsDesignerDrop(payload: DesignerDragPayload | null): boolean {
  return payload !== null;
}

/** Verifica arrasto da sidebar durante dragEnter/dragOver (sem ler getData). */
export function hasDesignerDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes(DESIGNER_DRAG_MIME);
}

export function clientToLocalPoint(
  clientX: number,
  clientY: number,
  element: HTMLElement,
  zoom: number
): { x: number; y: number } {
  const bounds = element.getBoundingClientRect();
  return {
    x: (clientX - bounds.left) / zoom,
    y: (clientY - bounds.top) / zoom,
  };
}

export function getPageContentElement(): HTMLElement | null {
  return document.querySelector('[data-designer-page-content]');
}

export function clientToPageContentPoint(
  clientX: number,
  clientY: number,
  zoom: number
): { x: number; y: number } | null {
  const pageEl = getPageContentElement();
  if (!pageEl) return null;
  const scale = getDesignerPageScale(pageEl, zoom);
  return clientToLocalPoint(clientX, clientY, pageEl, scale);
}

export function findBandAtPagePoint(
  x: number,
  y: number,
  page: ReportPage,
  bands: Record<string, ReportBand>
): ReportBand | null {
  const ids = [...getAllPlacedBandIds(page, bands)].reverse();
  for (const id of ids) {
    const band = bands[id];
    // Elementos soltos não recebem itens: soltar sobre eles cria outro elemento
    if (!band || band.type === 'divider' || band.element || isTableDataBand(band)) continue;
    const rect = getBandRect(band, page);
    if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
      return band;
    }
  }
  return null;
}

export interface DesignerDropActions {
  addBand: (type: BandType, options?: { position?: { x: number; y: number } }) => void;
  addComponent: (
    bandId: string,
    type: ComponentType,
    initialProps?: Partial<ReportComponent>,
    bandUpdates?: Partial<ReportBand>
  ) => void;
  addElement: (
    type: ComponentType,
    options?: { position?: { x: number; y: number }; initialProps?: Partial<ReportComponent> }
  ) => void;
  addListWithField: (dataSource: string, content: string, position?: { x: number; y: number }) => void;
}

export interface DropDataContext {
  data: Record<string, unknown[]>;
  catalog?: DataSourceCatalog;
  components: Record<string, ReportComponent>;
}

/** Fonte de lista de um campo `{fonte.campo}`; undefined para configuração (registro único) ou texto livre */
function getListFieldSource(content: string, { data, catalog }: DropDataContext): string | undefined {
  const source = /^\{([^.}]+)\.[^}]+\}$/.exec(content)?.[1];
  return source && getDataSourceKind(source, data, catalog) === 'list' ? source : undefined;
}

/** Lista sem campo da própria fonte (ou ligada a registro único) adota a fonte do primeiro campo de lista arrastado para dentro dela */
function getBandSourceUpdates(band: ReportBand | null | undefined, content: string, ctx: DropDataContext): Partial<ReportBand> | undefined {
  const source = getListFieldSource(content, ctx);
  if (!source || !band?.dataSource || band.dataSource === source || band.link || band.type === 'detailData' || !isListDataBand(band)) return undefined;
  const ownField = `{${band.dataSource}.`;
  const hasOwnField = band.components.some((id) => ctx.components[id]?.content.includes(ownField));
  return getDataSourceKind(band.dataSource, ctx.data, ctx.catalog) === 'singleton' || !hasOwnField ? { dataSource: source } : undefined;
}

/** Campo de lista solto sobre a folha vira uma lista de registros; outro conteúdo vira elemento solto */
function dropFieldOnPage(content: string, point: { x: number; y: number }, ctx: DropDataContext, actions: DesignerDropActions) {
  const source = getListFieldSource(content, ctx);
  if (source) return actions.addListWithField(source, content, point);
  actions.addElement('text', { position: point, initialProps: { ...FIELD_TEXT_PROPS, content } });
}

const FIELD_TEXT_PROPS = { style: { fontSize: '12px' }, rect: { x: 0, y: 0, width: 160, height: 24 } };

export interface BandSurfaceDropContext {
  bandId: string;
  zoom: number;
  rowHeight?: number;
  isTableLayout?: boolean;
  /** Banda de elemento solto: o que cair nela vira outro elemento na folha */
  isElement?: boolean;
  band?: ReportBand;
  dataContext: DropDataContext;
}

export function handleBandSurfaceDrop(
  e: DragEvent,
  context: BandSurfaceDropContext,
  actions: DesignerDropActions
): boolean {
  const payload = readDesignerDragPayload(e);
  if (!payload) return false;

  e.preventDefault();
  e.stopPropagation();

  if (payload.type === 'band') {
    const point = clientToPageContentPoint(e.clientX, e.clientY, context.zoom);
    if (!point) return false;
    actions.addBand(payload.bandType, { position: point });
    return true;
  }

  if (context.isTableLayout) return false;

  if (context.isElement && (payload.type === 'field' || payload.type === 'component')) {
    const point = clientToPageContentPoint(e.clientX, e.clientY, context.zoom);
    if (!point) return false;
    if (payload.type === 'field') {
      dropFieldOnPage(payload.content, point, context.dataContext, actions);
    } else {
      actions.addElement(payload.componentType, { position: point });
    }
    return true;
  }

  const bounds = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - bounds.left) / context.zoom;
  const y = (e.clientY - bounds.top) / context.zoom;

  if (payload.type === 'field') {
    actions.addComponent(
      context.bandId,
      'text',
      { rect: { x, y, width: 120, height: 24 }, content: payload.content, style: { fontSize: '12px' } },
      getBandSourceUpdates(context.band, payload.content, context.dataContext)
    );
    return true;
  }

  if (payload.type === 'component') {
    const size = getDefaultComponentSize(payload.componentType);
    actions.addComponent(context.bandId, payload.componentType, {
      rect: { x, y, ...size },
    });
    return true;
  }

  return false;
}

export function handlePageContentDrop(
  e: DragEvent,
  context: {
    zoom: number;
    page: ReportPage;
    bands: Record<string, ReportBand>;
    dataContext: DropDataContext;
  },
  actions: DesignerDropActions
): boolean {
  const payload = readDesignerDragPayload(e);
  if (!payload) return false;

  e.preventDefault();
  e.stopPropagation();

  const point = clientToLocalPoint(
    e.clientX,
    e.clientY,
    e.currentTarget as HTMLElement,
    context.zoom
  );

  if (payload.type === 'band') {
    actions.addBand(payload.bandType, { position: point });
    return true;
  }

  if (payload.type === 'field') {
    const band = findBandAtPagePoint(point.x, point.y, context.page, context.bands);
    if (!band) {
      dropFieldOnPage(payload.content, point, context.dataContext, actions);
      return true;
    }
    const bandRect = getBandRect(band, context.page);
    actions.addComponent(
      band.id,
      'text',
      {
        rect: {
          x: point.x - bandRect.x,
          y: point.y - bandRect.y,
          width: 120,
          height: 24,
        },
        content: payload.content,
        style: { fontSize: '12px' },
      },
      getBandSourceUpdates(band, payload.content, context.dataContext)
    );
    return true;
  }

  if (payload.type === 'component') {
    const band = findBandAtPagePoint(point.x, point.y, context.page, context.bands);
    if (!band) {
      actions.addElement(payload.componentType, { position: point });
      return true;
    }
    const bandRect = getBandRect(band, context.page);
    actions.addComponent(band.id, payload.componentType, {
      rect: {
        x: Math.max(0, point.x - bandRect.x),
        y: Math.max(0, point.y - bandRect.y),
        ...getDefaultComponentSize(payload.componentType),
      },
    });
    return true;
  }

  return false;
}
