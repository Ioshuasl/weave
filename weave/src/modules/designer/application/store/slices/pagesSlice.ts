import type { StateCreator } from 'zustand';
import { applyPresetToReport, flipPageOrientationInReport, updateReportPage, resolveActivePageId, createBlankReportPage, duplicateReportPage as duplicateReportPageInReport, removeReportPage as removeReportPageFromReport, renameReportPage as renameReportPageInReport } from '../../../../report/domain';
import { stateActivePageId } from '../activePage';
import { recordHistory } from '../historyRecording';
import type { DesignerState } from '../designerState';
import type { PagesSlice } from '../state/pagesSlice.types';

export const createPagesSlice: StateCreator<DesignerState, [], [], PagesSlice> = (set) => ({
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
});
