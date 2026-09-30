import type { StateCreator } from 'zustand';
import { createId } from '../../../../../shared/domain/id';
import { ReportBand, getBandRect, getDefaultBandRect, getDefaultDividerRect, getDefaultDataSource, getDefaultDataTable, getDefaultBulletList, getDefaultNumberedList, getBandDisplayLabel, applyDividerAngleUpdate, applyDividerLineUpdate, applyDividerPositionUpdate, defaultDividerLine, resolveDividerLine } from '../../../../band/domain';
import { clampRectToPage } from '../../../../page/domain';
import { stylePreviewDebug } from '../../../../../shared/diagnostics/stylePreviewDebug';
import { describeBandUpdate } from '../../../../history/domain';
import { buildBandDuplicate } from '../../../domain/designerDuplicate';
import { stateActivePage, stateActivePageId } from '../activePage';
import { filterSelectionForBandRemoval } from '../selectionFilters';
import { recordHistory } from '../historyRecording';
import type { DesignerState } from '../designerState';
import type { BandsSlice } from '../state/bandsSlice.types';

export const createBandsSlice: StateCreator<DesignerState, [], [], BandsSlice> = (set) => ({
  addBand: (type, options) => set((state) => {
    const newBandId = createId();
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
});
