import type { CSSProperties } from 'react';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  ReportDefinition,
  ReportBand,
  ReportComponent,
  ReportPage,
  BandType,
  ComponentType,
  type ChartProps,
} from '../types/report';
import { liveChartPreviewEqual } from '../utils/chartPropsUtils';
import {
  applyPresetToReport,
  flipPageOrientationInReport,
  updateReportPage,
} from '../utils/pageSizeUtils';
import {
  BUILTIN_PAGE_PRESET_CATALOG,
  buildPagePresetCatalog,
  type PagePresetCatalog,
  type PagePresetDefinition,
} from '../utils/pagePresets';
import {
  clampRectToPage,
  findPageIdForBand,
  getBandRect,
  getDefaultBandRect,
  getDefaultDividerRect,
  getReportPage,
  replaceReportPage,
  resolveActivePageId,
} from '../utils/reportPageUtils';
import {
  createBlankReportPage,
  duplicateReportPage as duplicateReportPageInReport,
  removeReportPage as removeReportPageFromReport,
  renameReportPage as renameReportPageInReport,
} from '../utils/pageCrudUtils';
import {
  getDefaultDataSource,
  getDefaultDataTable,
  getDefaultBulletList,
  getDefaultNumberedList,
  getBandDisplayLabel,
} from '../utils/dataBandUtils';
import { getComponentDisplayLabel } from '../utils/uiLabels';
import { DEFAULT_IMAGE_PLACEHOLDER_SRC } from '../utils/imagePropsUtils';
import { getDefaultComponentSize, squareQrRect } from '../utils/componentRectDefaults';
import {
  applyDividerAngleUpdate,
  applyDividerLineUpdate,
  applyDividerPositionUpdate,
  defaultDividerLine,
  resolveDividerLine,
} from '../utils/vectorLineUtils';
import { normalizeReportDefinition } from '../utils/reportMigration';
import { stylePreviewDebug } from '../utils/stylePreviewDebug';
import {
  appendHistoryEntry,
  cloneData,
  cloneReport,
  createHistoryEntry,
  describeBandUpdate,
  describeComponentUpdate,
  type HistoryEntry,
  type HistoryMeta,
} from '../utils/designerHistory';
import { isTextEditorModalDirty } from '../utils/textEditorModalUtils';
import type { SnapGuides } from '../utils/designerSnap';
import { DEMO_DATA, DEMO_REPORT } from '../mocks/demoReport';
import { buildBandDuplicate, buildComponentDuplicate } from '../utils/designerDuplicate';
import {
  buildPasteFromClipboard,
  canBandAcceptPastedComponents,
  componentToClipboardPayload,
  type DesignerClipboard,
  resolvePasteTargetBandId,
} from '../utils/designerClipboard';
import {
  applySelectionMode,
  getPrimarySelectedId,
  getSelectedBandIds,
  getSelectedComponentIds,
  getSelectedComponentsInBand,
  resolveSelectionAfterRestore,
  type SelectionMode,
} from '../utils/selectionUtils';

export interface LiveStylePreview {
  componentId: string;
  style: CSSProperties;
}

export interface LiveChartPreview {
  componentId: string;
  chartProps: Partial<ChartProps>;
}

export type TextEditorModalTextAlign = 'left' | 'center' | 'right';

export interface TextEditorModalDraft {
  content: string;
  fontSize: string;
  color: string;
  textAlign: TextEditorModalTextAlign;
  padding: string;
}

export interface TextEditorModalState {
  componentId: string;
  draft: TextEditorModalDraft;
  initialDraft: TextEditorModalDraft;
}

function buildTextEditorDraftFromComponent(component: ReportComponent): TextEditorModalDraft {
  return {
    content: component.content,
    fontSize: String(component.style.fontSize || '14px'),
    color: String(component.style.color || '#000000'),
    textAlign: (component.style.textAlign as TextEditorModalTextAlign) || 'left',
    padding: String(component.style.padding || ''),
  };
}

export interface ComponentGroupDrag {
  leaderId: string;
  bandId: string;
  memberIds: string[];
  startRects: Record<string, { x: number; y: number }>;
}

export interface BandGroupDrag {
  leaderId: string;
  memberIds: string[];
  startRects: Record<string, { x: number; y: number }>;
}

function stateActivePageId(state: DesignerState): string {
  return resolveActivePageId(state.report, state.activePageId);
}

function stateActivePage(state: DesignerState): ReportPage {
  const page = getReportPage(state.report, state.activePageId);
  if (!page) {
    throw new Error('Página ativa não encontrada');
  }
  return page;
}

interface DesignerState {
  report: ReportDefinition;
  /** Página de design em edição no canvas (Fase 3.1) */
  activePageId: string | null;
  selectedIds: string[];
  /** Folha selecionada via clique em área vazia do canvas (Fase 3.0) */
  selectedPageId: string | null;
  data: any; // The JSON data for preview
  /** Catálogo de presets (built-in + extensões do host — Fase 3.5) */
  pagePresetCatalog: PagePresetCatalog;
  /** Preview visual de estilo durante edição (não persiste no relatório até commit) */
  liveStylePreview: LiveStylePreview | null;
  /** Preview visual de chartProps durante edição (sem histórico até commit) */
  liveChartPreview: LiveChartPreview | null;
  /** Componente em arrasto — suspende fantasmas sem gravar posição no relatório */
  draggingComponentId: string | null;
  /** Alvo de hover no canvas (hit-test; não vai para o histórico) */
  canvasHoverId: string | null;
  historyPast: HistoryEntry[];
  historyPointer: number;
  snapEnabled: boolean;
  activeSnapGuides: SnapGuides | null;
  clipboard: DesignerClipboard | null;
  componentGroupDrag: ComponentGroupDrag | null;
  bandGroupDrag: BandGroupDrag | null;
  dragPreviewRects: Record<string, { x: number; y: number }> | null;
  /** Modal de edição de texto (duplo-clique no canvas) */
  textEditorModal: TextEditorModalState | null;
  /** Pré-visualização modal aberta sobre o canvas */
  previewModalOpen: boolean;

  // Actions
  setSelection: (
    id: string | null,
    options?: { mode?: SelectionMode; bringToFront?: boolean }
  ) => void;
  selectPage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  addReportPage: () => void;
  duplicateReportPage: (pageId: string) => void;
  removeReportPage: (pageId: string) => void;
  renameReportPage: (pageId: string, name: string) => void;
  clearSelection: () => void;
  updatePage: (
    pageId: string,
    updates: Partial<ReportPage>,
    options?: { scaleContent?: boolean }
  ) => void;
  applyPagePreset: (pageId: string, presetId: string) => void;
  flipPageOrientation: (pageId: string) => void;
  setHostPagePresets: (presets?: PagePresetDefinition[]) => void;
  removeSelected: () => void;
  beginComponentGroupDrag: (leaderId: string) => void;
  beginBandGroupDrag: (leaderId: string) => void;
  setDragPreviewRects: (rects: Record<string, { x: number; y: number }> | null) => void;
  commitComponentGroupDrag: (
    leaderId: string,
    leaderPos: { x: number; y: number }
  ) => void;
  commitBandGroupDrag: (leaderId: string, leaderPos: { x: number; y: number }) => void;
  cancelComponentGroupDrag: () => void;
  cancelBandGroupDrag: () => void;
  moveComponents: (
    updates: Array<{ id: string; rect: { x: number; y: number } }>
  ) => void;
  setLiveStylePreview: (preview: LiveStylePreview | null) => void;
  clearLiveStylePreview: () => void;
  setLiveChartPreview: (preview: LiveChartPreview | null) => void;
  clearLiveChartPreview: () => void;
  setDraggingComponentId: (id: string | null) => void;
  setCanvasHoverId: (id: string | null) => void;
  addBand: (type: BandType, options?: { position?: { x: number; y: number } }) => void;
  removeBand: (id: string) => void;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
  
  addComponent: (bandId: string, type: ComponentType, initialProps?: Partial<ReportComponent>) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ReportComponent>) => void;
  duplicateBand: (id: string) => void;
  duplicateComponent: (id: string) => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteToTargetBand: (targetBandId?: string) => void;
  clearClipboard: () => void;

  setReportData: (data: any) => void;
  loadReport: (report: ReportDefinition, options?: { data?: any; replaceData?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  jumpToHistory: (index: number) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setActiveSnapGuides: (guides: SnapGuides | null) => void;
  clearSnapGuides: () => void;
  openTextEditorModal: (componentId: string) => void;
  closeTextEditorModal: () => void;
  setPreviewModalOpen: (open: boolean) => void;
  patchTextEditorDraft: (patch: Partial<TextEditorModalDraft>) => void;
  commitTextEditorModal: () => void;
}

function reportsEqual(a: ReportDefinition, b: ReportDefinition): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function dataEqual(a: Record<string, unknown[]>, b: Record<string, unknown[]>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function filterSelection(selectedIds: string[], removedId: string): string[] {
  return selectedIds.filter((id) => id !== removedId);
}

function filterSelectionForBandRemoval(
  selectedIds: string[],
  bandId: string,
  band: ReportBand
): string[] {
  return selectedIds.filter((id) => id !== bandId && !band.components.includes(id));
}

function recordHistory<S extends DesignerState>(
  state: S,
  next: Partial<S>,
  meta: HistoryMeta
): S {
  const merged = { ...state, ...next } as S;
  if (reportsEqual(state.report, merged.report) && dataEqual(state.data, merged.data)) {
    return merged;
  }

  const { past, pointer } = appendHistoryEntry(
    state.historyPast,
    state.historyPointer,
    merged.report,
    merged.data,
    meta
  );

  stylePreviewDebug.countAction('history:record', { kind: meta.kind, label: meta.label });
  return { ...merged, historyPast: past, historyPointer: pointer };
}

function restoreHistoryEntry(state: DesignerState, index: number): Partial<DesignerState> {
  const entry = state.historyPast[index];
  if (!entry) return state;

  stylePreviewDebug.countAction(index < state.historyPointer ? 'history:undo' : 'history:jump', {
    index,
    label: entry.label,
  });

  return {
    report: cloneReport(entry.report),
    data: cloneData(entry.data),
    historyPointer: index,
    selectedIds: resolveSelectionAfterRestore(state.selectedIds, entry.report),
    activePageId: resolveActivePageId(entry.report, state.activePageId),
    selectedPageId: null,
    liveStylePreview: null,
    liveChartPreview: null,
    draggingComponentId: null,
    canvasHoverId: null,
    componentGroupDrag: null,
    bandGroupDrag: null,
    dragPreviewRects: null,
    textEditorModal: null,
    previewModalOpen: false,
  };
}

const DEFAULT_PAGE_WIDTH = 794; // A4 @ 96 DPI approx (210mm)
const DEFAULT_PAGE_HEIGHT = 1123; // A4 @ 96 DPI approx (297mm)

const INITIAL_REPORT: ReportDefinition = {
  id: 'rep_1',
  name: 'New Report',
  pages: [{
    id: 'page_1',
    name: 'Page 1',
    width: DEFAULT_PAGE_WIDTH,
    height: DEFAULT_PAGE_HEIGHT,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    bands: ['band_title', 'band_header', 'band_data', 'band_summary', 'band_footer']
  }],
  bands: {
    'band_title': {
      id: 'band_title',
      type: 'reportTitle',
      name: 'Report Title',
      height: 60,
      bandRect: { x: 8, y: 8, width: 738, height: 60 },
      components: ['comp_title']
    },
    'band_header': {
      id: 'band_header',
      type: 'pageHeader',
      name: 'Page Header',
      height: 40,
      bandRect: { x: 8, y: 76, width: 738, height: 40 },
      components: ['comp_h_name', 'comp_h_email', 'comp_h_role']
    },
    'band_data': {
      id: 'band_data',
      type: 'dataList',
      name: 'Lista livre',
      height: 30,
      bandRect: { x: 8, y: 124, width: 738, height: 30 },
      dataSource: 'users',
      components: ['comp_d_name', 'comp_d_email', 'comp_d_role']
    },
    'band_summary': {
      id: 'band_summary',
      type: 'reportSummary',
      name: 'Report Summary',
      height: 250,
      bandRect: { x: 8, y: 162, width: 738, height: 250 },
      components: ['comp_chart']
    },
    'band_footer': {
      id: 'band_footer',
      type: 'pageFooter',
      name: 'Page Footer',
      height: 30,
      bandRect: { x: 8, y: 420, width: 738, height: 30 },
      components: ['comp_footer']
    }
  },
  components: {
    'comp_title': {
      id: 'comp_title',
      type: 'text',
      name: 'Title',
      parentId: 'band_title',
      rect: { x: 10, y: 10, width: 300, height: 40 },
      content: '**User List Report**',
      style: { fontSize: '24px', color: '#4338ca' }
    },
    'comp_h_name': {
      id: 'comp_h_name',
      type: 'text',
      name: 'Header Name',
      parentId: 'band_header',
      rect: { x: 10, y: 10, width: 200, height: 20 },
      content: '**Name**',
      style: { fontSize: '14px', color: '#666' }
    },
    'comp_h_email': {
      id: 'comp_h_email',
      type: 'text',
      name: 'Header Email',
      parentId: 'band_header',
      rect: { x: 220, y: 10, width: 200, height: 20 },
      content: '**Email**',
      style: { fontSize: '14px', color: '#666' }
    },
    'comp_h_role': {
      id: 'comp_h_role',
      type: 'text',
      name: 'Header Role',
      parentId: 'band_header',
      rect: { x: 430, y: 10, width: 100, height: 20 },
      content: '**Role**',
      style: { fontSize: '14px', color: '#666' }
    },
    'comp_d_name': {
      id: 'comp_d_name',
      type: 'text',
      name: 'Data Name',
      parentId: 'band_data',
      rect: { x: 10, y: 5, width: 200, height: 20 },
      content: '{users.name}',
      style: { fontSize: '14px', color: '#000' }
    },
    'comp_d_email': {
      id: 'comp_d_email',
      type: 'text',
      name: 'Data Email',
      parentId: 'band_data',
      rect: { x: 220, y: 5, width: 200, height: 20 },
      content: '{users.email}',
      style: { fontSize: '14px', color: '#000' }
    },
    'comp_d_role': {
      id: 'comp_d_role',
      type: 'text',
      name: 'Data Role',
      parentId: 'band_data',
      rect: { x: 430, y: 5, width: 100, height: 20 },
      content: '{users.role}',
      style: { fontSize: '14px', color: '#000' }
    },
    'comp_footer': {
      id: 'comp_footer',
      type: 'text',
      name: 'Footer Text',
      parentId: 'band_footer',
      rect: { x: 10, y: 5, width: 300, height: 20 },
      content: 'Página {sys.pageNumber} de {sys.pageCount} · _Gerado pelo Weave_',
      style: { fontSize: '10px', color: '#999' }
    },
    'comp_chart': {
      id: 'comp_chart',
      type: 'chart',
      name: 'Sales Chart',
      parentId: 'band_summary',
      rect: { x: 10, y: 10, width: 400, height: 200 },
      content: '',
      style: { },
      chartProps: {
        chartKind: 'bar',
        dataset: 'users',
        xAxisKey: 'name',
        yAxisKey: 'sales',
        barColor: '#4f46e5',
        showGrid: true,
        showLegend: true,
        showTooltip: true,
      }
    }
  }
};

const NORMALIZED_INITIAL_REPORT = normalizeReportDefinition(INITIAL_REPORT);
const INITIAL_HISTORY_ENTRY = createHistoryEntry(NORMALIZED_INITIAL_REPORT, DEMO_DATA, {
  kind: 'init',
  label: 'Estado inicial',
});

export const useDesignerStore = create<DesignerState>((set, get) => ({
  report: NORMALIZED_INITIAL_REPORT,
  activePageId: NORMALIZED_INITIAL_REPORT.pages[0]?.id ?? null,
  selectedIds: [],
  selectedPageId: null,
  liveStylePreview: null,
  liveChartPreview: null,
  draggingComponentId: null,
  canvasHoverId: null,
  historyPast: [INITIAL_HISTORY_ENTRY],
  historyPointer: 0,
  snapEnabled: true,
  activeSnapGuides: null,
  clipboard: null,
  componentGroupDrag: null,
  bandGroupDrag: null,
  dragPreviewRects: null,
  data: DEMO_DATA,
  pagePresetCatalog: BUILTIN_PAGE_PRESET_CATALOG,
  textEditorModal: null,
  previewModalOpen: false,

  setHostPagePresets: (presets) =>
    set({
      pagePresetCatalog: buildPagePresetCatalog(presets),
    }),

  setLiveStylePreview: (preview) =>
    set((state) => {
      if (!preview) {
        if (state.liveStylePreview === null) return state;
        stylePreviewDebug.countAction('clearLiveStylePreview (via null)');
        return { liveStylePreview: null };
      }
      const prev = state.liveStylePreview;
      if (
        prev?.componentId === preview.componentId &&
        prev.style.color === preview.style.color &&
        prev.style.backgroundColor === preview.style.backgroundColor
      ) {
        return state;
      }
      stylePreviewDebug.time('setLiveStylePreview');
      stylePreviewDebug.countAction('setLiveStylePreview', preview.style);
      const next = { liveStylePreview: preview };
      stylePreviewDebug.timeEnd('setLiveStylePreview');
      return next;
    }),

  clearLiveStylePreview: () =>
    set((state) => {
      if (state.liveStylePreview === null) return state;
      stylePreviewDebug.countAction('clearLiveStylePreview');
      return { liveStylePreview: null };
    }),

  setLiveChartPreview: (preview) =>
    set((state) => {
      if (!preview) {
        if (state.liveChartPreview === null) return state;
        stylePreviewDebug.countAction('clearLiveChartPreview (via null)');
        return { liveChartPreview: null };
      }

      const prev = state.liveChartPreview;
      const merged: LiveChartPreview =
        prev?.componentId === preview.componentId
          ? {
              componentId: preview.componentId,
              chartProps: { ...prev.chartProps, ...preview.chartProps },
            }
          : preview;

      if (liveChartPreviewEqual(prev, merged)) return state;

      stylePreviewDebug.countAction('setLiveChartPreview', merged.chartProps);
      return { liveChartPreview: merged };
    }),

  clearLiveChartPreview: () =>
    set((state) => {
      if (state.liveChartPreview === null) return state;
      stylePreviewDebug.countAction('clearLiveChartPreview');
      return { liveChartPreview: null };
    }),

  setDraggingComponentId: (id) =>
    set((state) => {
      if (state.draggingComponentId === id) return state;
      if (id) {
        stylePreviewDebug.countAction('dragComponent:dragging', { componentId: id });
        return {
          draggingComponentId: id,
          liveStylePreview: null,
          liveChartPreview: null,
        };
      }
      return { draggingComponentId: id };
    }),

  setCanvasHoverId: (id) =>
    set((state) => (state.canvasHoverId === id ? state : { canvasHoverId: id })),

  setSelection: (id, options) =>
    set((state) => {
      const mode = options?.mode ?? 'replace';
      const bringToFront = options?.bringToFront ?? true;
      const clearStylePreview = {
        liveStylePreview: null as LiveStylePreview | null,
        liveChartPreview: null as LiveChartPreview | null,
      };

      if (!id) {
        return {
          selectedIds: [],
          selectedPageId: null,
          ...clearStylePreview,
          draggingComponentId: null,
        };
      }

      const nextSelectedIds = applySelectionMode(state.selectedIds, id, state.report, mode);
      if (nextSelectedIds.length === 0) {
        return {
          selectedIds: [],
          selectedPageId: null,
          ...clearStylePreview,
          draggingComponentId: null,
        };
      }

      const pageId = stateActivePageId(state);
      const page = stateActivePage(state);
      const component = state.report.components[id];

      if (!bringToFront) {
        const targetBandId = component?.parentId ?? (state.report.bands[id] ? id : null);
        const targetPageId = targetBandId
          ? findPageIdForBand(state.report, targetBandId)
          : null;
        return {
          selectedIds: nextSelectedIds,
          selectedPageId: null,
          ...(targetPageId ? { activePageId: targetPageId } : {}),
          ...clearStylePreview,
          draggingComponentId: null,
        };
      }

      if (component) {
        const parentId = component.parentId;
        const band = state.report.bands[parentId];
        if (!band) {
          return {
            selectedIds: nextSelectedIds,
            selectedPageId: null,
            ...clearStylePreview,
            draggingComponentId: null,
          };
        }

        const primaryId = getPrimarySelectedId(nextSelectedIds);
        if (primaryId !== id) {
          return {
            selectedIds: nextSelectedIds,
            selectedPageId: null,
            ...clearStylePreview,
            draggingComponentId: null,
          };
        }

        const alreadyOnTop = band.components[band.components.length - 1] === id;
        if (state.selectedIds.includes(id) && alreadyOnTop && mode === 'replace') {
          return { selectedIds: nextSelectedIds, selectedPageId: null, ...clearStylePreview };
        }

        const reorderedComponents = [...band.components.filter((c) => c !== id), id];
        const reorderedBands = page.bands.includes(parentId)
          ? [...page.bands.filter((b) => b !== parentId), parentId]
          : page.bands;

        return {
          selectedIds: nextSelectedIds,
          selectedPageId: null,
          ...clearStylePreview,
          draggingComponentId: null,
          report: {
            ...state.report,
            pages: state.report.pages.map((p) =>
              p.id === pageId ? { ...page, bands: reorderedBands } : p
            ),
            bands: {
              ...state.report.bands,
              [parentId]: { ...band, components: reorderedComponents },
            },
          },
        };
      }

      if (!page.bands.includes(id) && !(page.dividers ?? []).includes(id)) {
        return {
          selectedIds: nextSelectedIds,
          selectedPageId: null,
          ...clearStylePreview,
          draggingComponentId: null,
        };
      }

      const bandAlreadyOnTop = page.bands[page.bands.length - 1] === id;
      if (state.selectedIds.includes(id) && bandAlreadyOnTop && mode === 'replace') {
        return { selectedIds: nextSelectedIds, selectedPageId: null, ...clearStylePreview };
      }

      return {
        selectedIds: nextSelectedIds,
        selectedPageId: null,
        ...clearStylePreview,
        draggingComponentId: null,
        report: {
          ...state.report,
          pages: state.report.pages.map((p) =>
            p.id === pageId
              ? { ...page, bands: [...page.bands.filter((b) => b !== id), id] }
              : p
          ),
        },
      };
    }),

  selectPage: (pageId) =>
    set((state) => {
      if (!state.report.pages.some((page) => page.id === pageId)) return state;
      return {
        activePageId: pageId,
        selectedPageId: pageId,
        selectedIds: [],
        liveStylePreview: null,
        liveChartPreview: null,
        draggingComponentId: null,
      };
    }),

  setActivePage: (pageId) =>
    set((state) => {
      if (!state.report.pages.some((page) => page.id === pageId)) return state;
      return {
        activePageId: pageId,
        selectedPageId: pageId,
        selectedIds: [],
        liveStylePreview: null,
        liveChartPreview: null,
        draggingComponentId: null,
      };
    }),

  addReportPage: () =>
    set((state) => {
      const { page, report } = createBlankReportPage(
        state.report,
        { copyFromPageId: stateActivePageId(state) },
        state.pagePresetCatalog
      );
      return recordHistory(
        state,
        {
          report,
          activePageId: page.id,
          selectedPageId: page.id,
          selectedIds: [],
        },
        { kind: 'editPage', label: `Nova página: ${page.name}` }
      );
    }),

  duplicateReportPage: (pageId) =>
    set((state) => {
      const built = duplicateReportPageInReport(state.report, pageId);
      if (!built) return state;
      const newPage = built.report.pages.find((p) => p.id === built.newPageId);
      return recordHistory(
        state,
        {
          report: built.report,
          activePageId: built.newPageId,
          selectedPageId: built.newPageId,
          selectedIds: [],
        },
        {
          kind: 'editPage',
          label: `Duplicar página: ${newPage?.name ?? 'Página'}`,
        }
      );
    }),

  removeReportPage: (pageId) =>
    set((state) => {
      const report = removeReportPageFromReport(state.report, pageId);
      if (!report) return state;
      const nextActiveId = resolveActivePageId(report, null);
      return recordHistory(
        state,
        {
          report,
          activePageId: nextActiveId,
          selectedPageId: nextActiveId,
          selectedIds: [],
        },
        { kind: 'editPage', label: 'Excluir página' }
      );
    }),

  renameReportPage: (pageId, name) =>
    set((state) => {
      const report = renameReportPageInReport(state.report, pageId, name);
      if (report === state.report) return state;
      return recordHistory(state, { report }, {
        kind: 'editPage',
        label: 'Renomear página',
      });
    }),

  clearSelection: () =>
    set((state) => {
      if (state.selectedIds.length === 0 && state.selectedPageId === null) return state;
      return {
        selectedIds: [],
        selectedPageId: null,
        liveStylePreview: null,
        liveChartPreview: null,
        draggingComponentId: null,
      };
    }),

  updatePage: (pageId, updates, options) =>
    set((state) => {
      const report = updateReportPage(state.report, pageId, updates, options);
      if (report === state.report) return state;
      return recordHistory(state, { report }, {
        kind: 'editPage',
        label: 'Propriedades da folha',
      });
    }),

  applyPagePreset: (pageId, presetId) =>
    set((state) => {
      const report = applyPresetToReport(
        state.report,
        pageId,
        presetId,
        state.pagePresetCatalog
      );
      if (!report) return state;
      return recordHistory(state, { report }, {
        kind: 'editPage',
        label: 'Tamanho da folha',
      });
    }),

  flipPageOrientation: (pageId) =>
    set((state) => {
      const report = flipPageOrientationInReport(
        state.report,
        pageId,
        state.pagePresetCatalog
      );
      if (!report) return state;
      return recordHistory(state, { report }, {
        kind: 'editPage',
        label: 'Orientação da folha',
      });
    }),

  removeSelected: () =>
    set((state) => {
      const { selectedIds, report } = state;
      if (selectedIds.length === 0) return state;

      const bandIds = getSelectedBandIds(selectedIds, report);
      const componentIds = getSelectedComponentIds(selectedIds, report);

      if (bandIds.length === 0 && componentIds.length === 0) return state;

      const pageId = stateActivePageId(state);
      let nextReport = { ...report, components: { ...report.components }, bands: { ...report.bands } };
      let nextPage = { ...stateActivePage(state) };

      for (const bandId of bandIds) {
        const band = nextReport.bands[bandId];
        if (!band) continue;
        for (const compId of band.components) {
          delete nextReport.components[compId];
        }
        delete nextReport.bands[bandId];
        nextPage = {
          ...nextPage,
          bands: nextPage.bands.filter((bId) => bId !== bandId),
          dividers: (nextPage.dividers ?? []).filter((bId) => bId !== bandId),
        };
      }

      const remainingCompIds = componentIds.filter((id) => nextReport.components[id]);
      for (const compId of remainingCompIds) {
        const comp = nextReport.components[compId];
        if (!comp) continue;
        const band = nextReport.bands[comp.parentId];
        if (!band) continue;
        delete nextReport.components[compId];
        nextReport.bands = {
          ...nextReport.bands,
          [comp.parentId]: {
            ...band,
            components: band.components.filter((cId) => cId !== compId),
          },
        };
      }

      const reportNext = replaceReportPage(nextReport, pageId, nextPage);
      const count = bandIds.length + remainingCompIds.length;
      const label =
        count === 1
          ? bandIds.length === 1
            ? `Excluir banda: ${getBandDisplayLabel(report.bands[bandIds[0]]?.type ?? 'divider')}`
            : `Excluir componente: ${getComponentDisplayLabel(report.components[remainingCompIds[0]]?.type ?? 'text')}`
          : `Excluir ${count} itens`;

      const modalComponentId = state.textEditorModal?.componentId;
      const closeTextModal =
        modalComponentId != null &&
        (remainingCompIds.includes(modalComponentId) ||
          bandIds.some((bandId) => {
            const band = report.bands[bandId];
            return band?.components.includes(modalComponentId);
          }));

      return recordHistory(
        state,
        {
          report: reportNext,
          selectedIds: [],
          componentGroupDrag: null,
          bandGroupDrag: null,
          dragPreviewRects: null,
          ...(closeTextModal ? { textEditorModal: null } : {}),
        },
        { kind: bandIds.length ? 'removeBand' : 'removeComponent', label }
      );
    }),

  beginComponentGroupDrag: (leaderId) =>
    set((state) => {
      const comp = state.report.components[leaderId];
      if (!comp) return state;

      const members = getSelectedComponentsInBand(
        state.selectedIds,
        state.report,
        comp.parentId
      );
      if (members.length < 2 || !members.includes(leaderId)) {
        return { componentGroupDrag: null, dragPreviewRects: null };
      }

      const startRects: Record<string, { x: number; y: number }> = {};
      for (const id of members) {
        const c = state.report.components[id];
        if (c) startRects[id] = { x: c.rect.x, y: c.rect.y };
      }

      return {
        componentGroupDrag: {
          leaderId,
          bandId: comp.parentId,
          memberIds: members,
          startRects,
        },
        bandGroupDrag: null,
        dragPreviewRects: null,
      };
    }),

  beginBandGroupDrag: (leaderId) =>
    set((state) => {
      const band = state.report.bands[leaderId];
      if (!band) return state;

      const members = getSelectedBandIds(state.selectedIds, state.report);
      if (members.length < 2 || !members.includes(leaderId)) {
        return { bandGroupDrag: null };
      }

      const page = stateActivePage(state);
      const startRects: Record<string, { x: number; y: number }> = {};
      for (const id of members) {
        const b = state.report.bands[id];
        if (b) {
          const r = getBandRect(b, page);
          startRects[id] = { x: r.x, y: r.y };
        }
      }

      return {
        bandGroupDrag: { leaderId, memberIds: members, startRects },
        componentGroupDrag: null,
        dragPreviewRects: null,
      };
    }),

  setDragPreviewRects: (rects) =>
    set((state) => {
      if (state.dragPreviewRects === rects) return state;
      const same =
        state.dragPreviewRects &&
        rects &&
        JSON.stringify(state.dragPreviewRects) === JSON.stringify(rects);
      if (same) return state;
      return { dragPreviewRects: rects };
    }),

  commitComponentGroupDrag: (leaderId, leaderPos) =>
    set((state) => {
      const drag = state.componentGroupDrag;
      if (!drag || drag.leaderId !== leaderId) return state;

      const leaderStart = drag.startRects[leaderId];
      if (!leaderStart) {
        return { componentGroupDrag: null, bandGroupDrag: null, dragPreviewRects: null };
      }

      const dx = leaderPos.x - leaderStart.x;
      const dy = leaderPos.y - leaderStart.y;

      const updates = drag.memberIds
        .map((id) => {
          const comp = state.report.components[id];
          const start = drag.startRects[id];
          if (!comp || !start) return null;
          return {
            id,
            rect: { ...comp.rect, x: start.x + dx, y: start.y + dy },
          };
        })
        .filter(Boolean) as Array<{ id: string; rect: { x: number; y: number; width: number; height: number } }>;

      if (updates.length === 0) {
        return { componentGroupDrag: null, bandGroupDrag: null, dragPreviewRects: null };
      }

      const components = { ...state.report.components };
      for (const { id, rect } of updates) {
        components[id] = { ...components[id], rect };
      }

      const report = { ...state.report, components };
      const label =
        updates.length === 1
          ? 'Mover componente'
          : `Mover ${updates.length} componentes`;

      return recordHistory(
        state,
        { report, componentGroupDrag: null, bandGroupDrag: null, dragPreviewRects: null },
        { kind: 'updateComponent', targetId: leaderId, label }
      );
    }),

  commitBandGroupDrag: (leaderId, leaderPos) =>
    set((state) => {
      const drag = state.bandGroupDrag;
      if (!drag || drag.leaderId !== leaderId) return state;

      const leaderStart = drag.startRects[leaderId];
      if (!leaderStart) {
        return { bandGroupDrag: null, dragPreviewRects: null };
      }

      const dx = leaderPos.x - leaderStart.x;
      const dy = leaderPos.y - leaderStart.y;
      const page = stateActivePage(state);
      const bands = { ...state.report.bands };

      for (const id of drag.memberIds) {
        const band = bands[id];
        const start = drag.startRects[id];
        if (!band || !start) continue;

        const currentRect = getBandRect(band, page);
        const nextRect = {
          ...currentRect,
          x: start.x + dx,
          y: start.y + dy,
        };

        if (band.type === 'divider') {
          bands[id] = { ...band, ...applyDividerPositionUpdate(nextRect) };
        } else {
          bands[id] = {
            ...band,
            bandRect: nextRect,
            height: nextRect.height,
          };
        }
      }

      const report = { ...state.report, bands };
      const label =
        drag.memberIds.length === 1
          ? 'Mover banda'
          : `Mover ${drag.memberIds.length} bandas`;

      return recordHistory(
        state,
        { report, bandGroupDrag: null, dragPreviewRects: null },
        { kind: 'updateBand', targetId: leaderId, label }
      );
    }),

  cancelComponentGroupDrag: () =>
    set((state) => {
      if (!state.componentGroupDrag && !state.bandGroupDrag && !state.dragPreviewRects) {
        return state;
      }
      return { componentGroupDrag: null, bandGroupDrag: null, dragPreviewRects: null };
    }),

  cancelBandGroupDrag: () =>
    set((state) => {
      if (!state.componentGroupDrag && !state.bandGroupDrag && !state.dragPreviewRects) {
        return state;
      }
      return { componentGroupDrag: null, bandGroupDrag: null, dragPreviewRects: null };
    }),

  moveComponents: (updates) =>
    set((state) => {
      if (updates.length === 0) return state;

      const components = { ...state.report.components };
      for (const { id, rect } of updates) {
        const current = components[id];
        if (!current) continue;
        components[id] = { ...current, rect: { ...current.rect, ...rect } };
      }

      const report = { ...state.report, components };
      const label =
        updates.length === 1 ? 'Mover componente' : `Mover ${updates.length} componentes`;

      return recordHistory(state, { report }, {
        kind: 'updateComponent',
        targetId: updates[0].id,
        label,
      });
    }),

  addBand: (type, options) => set((state) => {
    const newBandId = uuidv4();
    const pageId = stateActivePageId(state);
    const page = stateActivePage(state);

    const stackIndex = page.bands.length;
    const height =
      type === 'divider' ? 24
      : type === 'pageHeader' || type === 'pageFooter' ? 40
      : 80;
    let bandRect =
      type === 'divider'
        ? getDefaultDividerRect(page)
        : getDefaultBandRect(page, height, stackIndex);

    if (options?.position) {
      bandRect = clampRectToPage(
        {
          ...bandRect,
          x: options.position.x,
          y: options.position.y,
        },
        page
      );
    }

    const defaultDataSource = getDefaultDataSource(state.data);

    const newBand: ReportBand = {
      id: newBandId,
      type,
      name: getBandDisplayLabel(type),
      height: bandRect.height,
      bandRect,
      components: [],
      ...(type === 'divider'
        ? (() => {
            const dividerLine = defaultDividerLine(bandRect);
            return {
              dividerColor: '#a3a3a3',
              dividerLine,
              dividerAngle: 0,
              dividerThickness: 1,
              dividerRect: bandRect,
            };
          })()
        : {}),
      ...(type === 'dataList' || type === 'dataListNumbered' || type === 'dataTable'
        ? { dataSource: defaultDataSource || 'users' }
        : {}),
      ...(type === 'dataListNumbered'
        ? { numberedList: getDefaultNumberedList() }
        : {}),
      ...(type === 'dataList' ? { bulletList: getDefaultBulletList() } : {}),
      ...(type === 'dataTable'
        ? {
            dataTable: getDefaultDataTable(
              defaultDataSource || 'users',
              state.data
            ),
          }
        : {}),
      ...(type === 'masterData'
        ? { dataSource: defaultDataSource || 'users', dataLayout: 'list' as const }
        : {}),
      ...(type === 'detailData' ? { dataLayout: 'list' as const } : {}),
    };

    const isDivider = type === 'divider';
    const dividers = page.dividers ?? [];

    const nextPage = {
      ...page,
      bands: isDivider ? page.bands : [...page.bands, newBandId],
      dividers: isDivider ? [...dividers, newBandId] : dividers,
    };

    const report = {
      ...state.report,
      bands: { ...state.report.bands, [newBandId]: newBand },
      pages: state.report.pages.map((p) => (p.id === pageId ? nextPage : p)),
    };

    return recordHistory(state, { report, selectedIds: [newBandId] }, {
      kind: 'addBand',
      targetId: newBandId,
      label: `Adicionar banda: ${getBandDisplayLabel(type)}`,
    });
  }),

  removeBand: (id) => set((state) => {
    const band = state.report.bands[id];
    if (!band) return state;

    // Remove all components in band
    const newComponents = { ...state.report.components };
    band.components.forEach(cId => delete newComponents[cId]);

    const newBands = { ...state.report.bands };
    delete newBands[id];

    const pageId = stateActivePageId(state);
    const activePage = stateActivePage(state);
    const nextPage = {
      ...activePage,
      bands: activePage.bands.filter((bId) => bId !== id),
      dividers: (activePage.dividers ?? []).filter((bId) => bId !== id),
    };

    const report = {
      ...state.report,
      components: newComponents,
      bands: newBands,
      pages: state.report.pages.map((p) => (p.id === pageId ? nextPage : p)),
    };

    const nextSelectedIds = filterSelectionForBandRemoval(state.selectedIds, id, band);

    return recordHistory(
      state,
      { report, selectedIds: nextSelectedIds },
      {
        kind: 'removeBand',
        targetId: id,
        label: `Excluir banda: ${getBandDisplayLabel(band.type)}`,
      }
    );
  }),

  updateBand: (id, updates) => {
    stylePreviewDebug.countAction('updateBand', { id, keys: Object.keys(updates) });
    stylePreviewDebug.time(`updateBand:${id}`);
    set((state) => {
      const current = state.report.bands[id];
      if (!current) {
        stylePreviewDebug.timeEnd(`updateBand:${id}`);
        return state;
      }

      const page = stateActivePage(state);
      let next = { ...current, ...updates };

      if (current.type === 'divider') {
        const isPurePositionMove =
          (updates.dividerRect !== undefined || updates.bandRect !== undefined) &&
          updates.dividerLine === undefined &&
          updates.dividerAngle === undefined &&
          updates.dividerThickness === undefined;

        if (isPurePositionMove) {
          const movedRect = updates.dividerRect ?? updates.bandRect!;
          next = { ...next, ...applyDividerPositionUpdate(movedRect) };
        }

        const rect = getBandRect(next, page);

        if (updates.dividerAngle !== undefined && updates.dividerLine === undefined) {
          next = { ...next, ...applyDividerAngleUpdate(next, rect, updates.dividerAngle) };
        } else if (
          updates.dividerThickness !== undefined &&
          updates.dividerLine === undefined &&
          updates.dividerAngle === undefined
        ) {
          const line = resolveDividerLine(next, rect);
          next = {
            ...next,
            ...applyDividerLineUpdate(next, rect, line, updates.dividerThickness),
          };
        }
      }

      const rectUpdate = updates.bandRect ?? updates.dividerRect;
      if (rectUpdate && current.type !== 'divider') {
        next.height = rectUpdate.height;
        next.bandRect = rectUpdate;
      }

      const report = {
        ...state.report,
        bands: {
          ...state.report.bands,
          [id]: next,
        },
      };
      stylePreviewDebug.timeEnd(`updateBand:${id}`);
      return recordHistory(state, { report }, describeBandUpdate(id, updates, current));
    });
  },

  addComponent: (bandId, type, initialProps) => set((state) => {
    const newCompId = uuidv4();
    
    const size = getDefaultComponentSize(type);
    const defaultRect = { x: 10, y: 10, ...size };
    const mergedRect = initialProps?.rect ? { ...defaultRect, ...initialProps.rect } : defaultRect;
    const rect = type === 'qr' ? squareQrRect(mergedRect) : mergedRect;

    const newComp: ReportComponent = {
      id: newCompId,
      type,
      name: `${type}1`,
      parentId: bandId,
      rect,
      content: initialProps?.content ?? (type === 'text' ? 'Texto' : (type === 'image' ? DEFAULT_IMAGE_PLACEHOLDER_SRC : '')),
      style: { 
        fontSize: '14px', 
        color: '#000000',
        backgroundColor: type === 'shape' ? '#e5e5e5' : (type === 'line' ? '#000000' : undefined),
        border: type === 'shape' ? '1px solid #000' : undefined,
        ...initialProps?.style
      },
      imageProps: type === 'image' ? {
        sizeMode: 'contain',
        ...initialProps?.imageProps,
      } : undefined,
      qrProps: type === 'qr' ? {
        errorCorrection: 'M',
        foreground: '#000000',
        background: '#ffffff',
        margin: 1,
        ...initialProps?.qrProps,
      } : undefined,
      tableProps: type === 'table' ? {
        rows: [
          ['Coluna 1', 'Coluna 2'],
          ['Célula 1', 'Célula 2']
        ],
        hasHeader: true
      } : undefined,
      chartProps: type === 'chart' ? {
        chartKind: 'bar',
        dataset: 'users',
        xAxisKey: 'name',
        yAxisKey: 'id',
        barColor: '#8884d8',
        showGrid: true,
        showLegend: true,
        showTooltip: true,
      } : undefined
    };

    const report = {
      ...state.report,
      components: { ...state.report.components, [newCompId]: newComp },
      bands: {
        ...state.report.bands,
        [bandId]: {
          ...state.report.bands[bandId],
          components: [...state.report.bands[bandId].components, newCompId],
        },
      },
    };

    return recordHistory(state, { report, selectedIds: [newCompId] }, {
      kind: 'addComponent',
      targetId: newCompId,
      label: `Adicionar componente: ${getComponentDisplayLabel(type)}`,
    });
  }),

  removeComponent: (id) => set((state) => {
    const comp = state.report.components[id];
    if (!comp) return state;

    const band = state.report.bands[comp.parentId];
    const newComponents = { ...state.report.components };
    delete newComponents[id];

    const report = {
      ...state.report,
      components: newComponents,
      bands: {
        ...state.report.bands,
        [comp.parentId]: {
          ...band,
          components: band.components.filter(cId => cId !== id),
        },
      },
    };

    return recordHistory(
      state,
      {
        report,
        selectedIds: filterSelection(state.selectedIds, id),
        textEditorModal:
          state.textEditorModal?.componentId === id ? null : state.textEditorModal,
      },
      {
        kind: 'removeComponent',
        targetId: id,
        label: `Excluir componente: ${getComponentDisplayLabel(comp.type)}`,
      }
    );
  }),

  duplicateBand: (id) =>
    set((state) => {
      const band = state.report.bands[id];
      if (!band) return state;

      const built = buildBandDuplicate(state.report, id, state.activePageId);
      if (!built) return state;

      return recordHistory(state, { report: built.report, selectedIds: [built.newBandId] }, {
        kind: 'duplicateBand',
        targetId: built.newBandId,
        label: `Duplicar banda: ${getBandDisplayLabel(band.type)}`,
      });
    }),

  duplicateComponent: (id) =>
    set((state) => {
      const comp = state.report.components[id];
      if (!comp) return state;

      const built = buildComponentDuplicate(state.report, id, state.activePageId);
      if (!built) return state;

      return recordHistory(
        state,
        { report: built.report, selectedIds: [built.newComponentId] },
        {
          kind: 'duplicateComponent',
          targetId: built.newComponentId,
          label: `Duplicar componente: ${getComponentDisplayLabel(comp.type)}`,
        }
      );
    }),

  copySelected: () =>
    set((state) => {
      const componentIds = getSelectedComponentIds(state.selectedIds, state.report);
      if (componentIds.length === 0) return state;

      const first = state.report.components[componentIds[0]];
      if (!first) return state;

      return {
        clipboard: {
          sourceBandId: first.parentId,
          items: componentIds
            .map((id) => state.report.components[id])
            .filter(Boolean)
            .map((comp) => componentToClipboardPayload(comp!)),
        },
      };
    }),

  pasteToTargetBand: (targetBandId) =>
    set((state) => {
      const { clipboard, report, selectedIds } = state;
      if (!clipboard || clipboard.items.length === 0) return state;

      const resolvedTarget =
        targetBandId ?? resolvePasteTargetBandId(report, getPrimarySelectedId(selectedIds));
      if (!resolvedTarget) return state;

      const targetBand = report.bands[resolvedTarget];
      if (!canBandAcceptPastedComponents(targetBand)) return state;

      const built = buildPasteFromClipboard(report, clipboard, resolvedTarget);
      if (!built || built.newComponentIds.length === 0) return state;

      const lastId = built.newComponentIds[built.newComponentIds.length - 1];
      const label =
        built.newComponentIds.length === 1
          ? `Colar componente: ${getComponentDisplayLabel(clipboard.items[0].type)}`
          : `Colar ${built.newComponentIds.length} componentes`;

      return recordHistory(
        state,
        { report: built.report, selectedIds: built.newComponentIds },
        {
          kind: 'pasteComponent',
          targetId: lastId,
          label,
        }
      );
    }),

  clearClipboard: () =>
    set((state) => {
      if (state.clipboard === null) return state;
      return { clipboard: null };
    }),

  duplicateSelected: () =>
    set((state) => {
      const { selectedIds, report } = state;
      if (selectedIds.length === 0) return state;

      const componentIds = getSelectedComponentIds(selectedIds, report);
      const bandIds = getSelectedBandIds(selectedIds, report);

      if (componentIds.length > 0) {
        let nextReport = report;
        const newIds: string[] = [];
        for (const id of componentIds) {
          const built = buildComponentDuplicate(nextReport, id);
          if (!built) continue;
          nextReport = built.report;
          newIds.push(built.newComponentId);
        }
        if (newIds.length === 0) return state;
        return recordHistory(state, { report: nextReport, selectedIds: newIds }, {
          kind: 'duplicateComponent',
          targetId: newIds[newIds.length - 1],
          label:
            newIds.length === 1
              ? `Duplicar componente: ${getComponentDisplayLabel(report.components[componentIds[0]]?.type ?? 'text')}`
              : `Duplicar ${newIds.length} componentes`,
        });
      }

      if (bandIds.length === 1) {
        const band = report.bands[bandIds[0]];
        const built = buildBandDuplicate(report, bandIds[0]);
        if (!built || !band) return state;
        return recordHistory(state, { report: built.report, selectedIds: [built.newBandId] }, {
          kind: 'duplicateBand',
          targetId: built.newBandId,
          label: `Duplicar banda: ${getBandDisplayLabel(band.type)}`,
        });
      }

      return state;
    }),

  updateComponent: (id, updates) => {
    stylePreviewDebug.countAction('updateComponent', { id, keys: Object.keys(updates) });
    stylePreviewDebug.time(`updateComponent:${id}`);
    set((state) => {
      const current = state.report.components[id];
      if (!current) {
        stylePreviewDebug.timeEnd(`updateComponent:${id}`);
        return state;
      }

      const next = { ...current, ...updates };
      if (next.type === 'qr' && updates.rect) {
        next.rect = squareQrRect(next.rect);
      }

      const report = {
        ...state.report,
        components: {
          ...state.report.components,
          [id]: next,
        },
      };
      stylePreviewDebug.timeEnd(`updateComponent:${id}`);
      return recordHistory(state, { report }, describeComponentUpdate(id, updates, current));
    });
  },

  setReportData: (data) =>
    set((state) => {
      const nextData = data as Record<string, unknown[]>;
      if (dataEqual(state.data, nextData)) return state;
      return recordHistory(state, { data: nextData }, {
        kind: 'editData',
        label: 'Editar dados de preview',
      });
    }),

  loadReport: (report, options) =>
    set((state) => {
      const normalized = normalizeReportDefinition(report);
      const nextData =
        options?.data !== undefined
          ? options.replaceData === false
            ? { ...state.data, ...options.data }
            : (options.data as Record<string, unknown[]>)
          : state.data;

      const entry = createHistoryEntry(normalized, nextData, {
        kind: 'import',
        label: 'Importar relatório',
      });

      return {
        report: normalized,
        data: nextData,
        selectedIds: [],
        activePageId: normalized.pages[0]?.id ?? null,
        selectedPageId: null,
        liveStylePreview: null,
        liveChartPreview: null,
        draggingComponentId: null,
        componentGroupDrag: null,
        bandGroupDrag: null,
        dragPreviewRects: null,
        textEditorModal: null,
        historyPast: [entry],
        historyPointer: 0,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyPointer <= 0) return state;
      return restoreHistoryEntry(state, state.historyPointer - 1);
    }),

  redo: () =>
    set((state) => {
      if (state.historyPointer >= state.historyPast.length - 1) return state;
      return restoreHistoryEntry(state, state.historyPointer + 1);
    }),

  jumpToHistory: (index) =>
    set((state) => {
      if (index < 0 || index >= state.historyPast.length) return state;
      if (index === state.historyPointer) return state;
      return restoreHistoryEntry(state, index);
    }),

  setSnapEnabled: (enabled) =>
    set((state) => {
      if (state.snapEnabled === enabled) return state;
      return { snapEnabled: enabled };
    }),

  setActiveSnapGuides: (guides) =>
    set((state) => {
      const prev = state.activeSnapGuides;
      const same =
        prev === guides ||
        (prev &&
          guides &&
          prev.vertical.join() === guides.vertical.join() &&
          prev.horizontal.join() === guides.horizontal.join());
      if (same) return state;
      return { activeSnapGuides: guides };
    }),

  clearSnapGuides: () =>
    set((state) => {
      if (state.activeSnapGuides === null) return state;
      return { activeSnapGuides: null };
    }),

  openTextEditorModal: (componentId) =>
    set((state) => {
      const component = state.report.components[componentId];
      if (!component || component.type !== 'text') return state;

      const existing = state.textEditorModal;
      if (existing) {
        if (existing.componentId === componentId) return state;
        if (isTextEditorModalDirty(existing)) return state;
      }

      const draft = buildTextEditorDraftFromComponent(component);
      return {
        textEditorModal: {
          componentId,
          draft: { ...draft },
          initialDraft: { ...draft },
        },
      };
    }),

  closeTextEditorModal: () =>
    set((state) => {
      if (state.textEditorModal === null) return state;
      return { textEditorModal: null };
    }),

  setPreviewModalOpen: (open) =>
    set((state) => {
      if (state.previewModalOpen === open) return state;
      return { previewModalOpen: open };
    }),

  patchTextEditorDraft: (patch) =>
    set((state) => {
      if (!state.textEditorModal) return state;
      return {
        textEditorModal: {
          ...state.textEditorModal,
          draft: { ...state.textEditorModal.draft, ...patch },
        },
      };
    }),

  commitTextEditorModal: () =>
    set((state) => {
      const modal = state.textEditorModal;
      if (!modal) return state;

      const current = state.report.components[modal.componentId];
      if (!current) {
        return { textEditorModal: null };
      }

      const { content, fontSize, color, textAlign, padding } = modal.draft;
      const updates: Partial<ReportComponent> = {
        content,
        style: {
          ...current.style,
          fontSize,
          color,
          textAlign,
          padding: padding || undefined,
        },
      };

      const report = {
        ...state.report,
        components: {
          ...state.report.components,
          [modal.componentId]: { ...current, ...updates },
        },
      };

      return recordHistory(
        state,
        { report, textEditorModal: null },
        describeComponentUpdate(modal.componentId, updates, current)
      );
    }),
}));
