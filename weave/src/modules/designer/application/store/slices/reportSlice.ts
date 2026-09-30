import type { StateCreator } from 'zustand';
import { normalizeReportDefinition } from '../../../../report/domain';
import { BUILTIN_PAGE_PRESET_CATALOG, buildPagePresetCatalog } from '../../../../page/domain';
import { createHistoryEntry } from '../../../../history/domain';
import { dataEqual, recordHistory } from '../historyRecording';
import { INITIAL_DATA, NORMALIZED_INITIAL_REPORT } from '../initialState';
import type { DesignerState } from '../designerState';
import type { ReportSlice } from '../state/reportSlice.types';

export const createReportSlice: StateCreator<DesignerState, [], [], ReportSlice> = (set) => ({
  report: NORMALIZED_INITIAL_REPORT,
  activePageId: NORMALIZED_INITIAL_REPORT.pages[0]?.id ?? null,
  data: INITIAL_DATA,
  pagePresetCatalog: BUILTIN_PAGE_PRESET_CATALOG,

  setHostPagePresets: (presets) =>
    set({
      pagePresetCatalog: buildPagePresetCatalog(presets),
    }),

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
});
