import { applyAssistantActions } from '../../../../assistant/domain';
import { applyBandLinesPreset } from '../../../../band/domain';
import { createHistoryEntry } from '../../../../history/domain';
import { BUILTIN_PAGE_PRESET_CATALOG, buildPagePresetCatalog } from '../../../../page/domain';
import { renameCalculo } from '../../../../expression/domain';
import { normalizeReportDefinition } from '../../../../report/domain';
import { dataEqual, recordHistory } from '../historyRecording';
import { INITIAL_DATA, NORMALIZED_INITIAL_REPORT } from '../initialState';
import type { DesignerState } from '../designerState';
import type { ReportSlice } from '../state/reportSlice.types';
import type { StateCreator } from 'zustand';

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

  setCalculos: (calculos) =>
    set((state) => {
      if (JSON.stringify(state.report.calculos ?? []) === JSON.stringify(calculos)) return state;
      return recordHistory(state, { report: { ...state.report, calculos } }, {
        kind: 'editCalculos',
        label: 'Editar cálculos',
      });
    }),

  renameCalculo: (id, nome) =>
    set((state) => {
      const report = renameCalculo(state.report, id, nome);
      if (report === state.report) return state;
      return recordHistory(state, { report }, { kind: 'editCalculos', label: 'Renomear cálculo' });
    }),

  applyAssistantActions: (actions) => {
    let result = { applied: 0, skipped: actions.length };
    set((state) => {
      const { report, applied, skipped } = applyAssistantActions(state.report, actions);
      result = { applied, skipped };
      if (!applied) return state;
      return recordHistory(state, { report }, {
        kind: 'assistant',
        label: `Assistente de IA: ${applied} ${applied === 1 ? 'alteração' : 'alterações'}`,
      });
    });
    return result;
  },

  applyBandLinesPreset: (preset) =>
    set((state) =>
      recordHistory(state, { report: applyBandLinesPreset(state.report, preset) }, {
        kind: 'updateBand',
        label: `Estilo de linhas: ${preset === 'grid' ? 'grade de cartório' : preset === 'simple' ? 'linhas simples' : 'sem linhas'}`,
      })
    ),

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
