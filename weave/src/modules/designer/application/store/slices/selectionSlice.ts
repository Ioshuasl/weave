import type { StateCreator } from 'zustand';
import { findPageIdForBand, replaceReportPage } from '../../../../report/domain';
import { getBandDisplayLabel } from '../../../../band/domain';
import { getComponentDisplayLabel, type LiveStylePreview } from '../../../../components/common/domain';
import { type LiveChartPreview } from '../../../../components/chart/domain';
import { buildBandDuplicate, buildComponentDuplicate } from '../../../domain/designerDuplicate';
import { applySelectionMode, getPrimarySelectedId, getSelectedBandIds, getSelectedComponentIds } from '../../../domain/selectionUtils';
import { stateActivePage, stateActivePageId } from '../activePage';
import { recordHistory } from '../historyRecording';
import type { DesignerState } from '../designerState';
import type { SelectionSlice } from '../state/selectionSlice.types';

export const createSelectionSlice: StateCreator<DesignerState, [], [], SelectionSlice> = (set) => ({
  selectedIds: [],
  selectedPageId: null,
  canvasHoverId: null,

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

  setCanvasHoverId: (id) =>
    set((state) => (state.canvasHoverId === id ? state : { canvasHoverId: id })),

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
});
