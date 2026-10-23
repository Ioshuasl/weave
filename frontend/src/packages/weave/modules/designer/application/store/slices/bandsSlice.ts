import { stylePreviewDebug } from '../../../../../shared/diagnostics/stylePreviewDebug';
import { createId } from '../../../../../shared/domain/id';
import { ReportBand, getBandRect, getDefaultBandRect, getDefaultDividerRect, getDefaultDataSource, getDefaultDataTable, getDefaultBulletList, getDefaultNumberedList, getBandDisplayLabel, applyDividerAngleUpdate, applyDividerLineUpdate, applyDividerPositionUpdate, defaultDividerLine, resolveDividerLine } from '../../../../band/domain';
import { getComponentDisplayLabel, type ReportComponent } from '../../../../components/common/domain';
import { describeBandUpdate } from '../../../../history/domain';
import { clampRectToPage } from '../../../../page/domain';
import { buildNewComponent } from '../../../domain/componentFactory';
import { buildBandDuplicate } from '../../../domain/designerDuplicate';
import { stateActivePage, stateActivePageId } from '../activePage';
import { recordHistory } from '../historyRecording';
import { filterSelectionForBandRemoval } from '../selectionFilters';
import type { DesignerState } from '../designerState';
import type { BandsSlice } from '../state/bandsSlice.types';
import type { StateCreator } from 'zustand';

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

    const defaultDataSource = options?.dataSource ?? getDefaultDataSource(state.data);

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
        ? { dataSource: defaultDataSource || 'users', autoHeight: true }
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

  addElement: (type, options) =>
    set((state) => {
      const pageId = stateActivePageId(state);
      const page = stateActivePage(state);
      const bandId = createId();
      const component = buildNewComponent(bandId, type, options?.initialProps);
      // Sem posição (clique na paleta): cascata no topo da folha para não empilhar no mesmo lugar
      const cascade = (Object.values(state.report.bands).filter((band) => band.element).length % 10) * 16;
      const position = options?.position ?? { x: 16 + cascade, y: 16 + cascade };
      const bandRect = clampRectToPage(
        { x: position.x, y: position.y, width: component.rect.width, height: component.rect.height },
        page
      );

      const band: ReportBand = {
        id: bandId,
        type: 'reportTitle',
        name: getComponentDisplayLabel(type),
        element: true,
        height: bandRect.height,
        bandRect,
        components: [component.id],
      };

      const report = {
        ...state.report,
        bands: { ...state.report.bands, [bandId]: band },
        components: {
          ...state.report.components,
          [component.id]: { ...component, rect: { ...component.rect, x: 0, y: 0, width: bandRect.width, height: bandRect.height } },
        },
        pages: state.report.pages.map((p) => (p.id === pageId ? { ...page, bands: [...page.bands, bandId] } : p)),
      };

      return recordHistory(state, { report, selectedIds: [component.id] }, {
        kind: 'addComponent',
        targetId: component.id,
        label: `Adicionar ${getComponentDisplayLabel(type).toLowerCase()}`,
      });
    }),

  addListWithField: (dataSource, content, position) =>
    set((state) => {
      const pageId = stateActivePageId(state);
      const page = stateActivePage(state);
      const bandId = createId();
      const component = buildNewComponent(bandId, 'text', { content, style: { fontSize: '12px' }, rect: { x: 0, y: 0, width: 160, height: 24 } });
      const base = getDefaultBandRect(page, 28, page.bands.length);
      const bandRect = clampRectToPage(
        { ...base, x: position?.x ?? base.x, y: position?.y ?? base.y, width: Math.max(200, base.width - ((position?.x ?? base.x) - base.x)) },
        page
      );

      const band: ReportBand = {
        id: bandId,
        type: 'dataList',
        name: getBandDisplayLabel('dataList'),
        height: bandRect.height,
        bandRect,
        dataSource,
        autoHeight: true,
        bulletList: getDefaultBulletList(),
        components: [component.id],
      };

      const report = {
        ...state.report,
        bands: { ...state.report.bands, [bandId]: band },
        components: { ...state.report.components, [component.id]: component },
        pages: state.report.pages.map((p) => (p.id === pageId ? { ...page, bands: [...page.bands, bandId] } : p)),
      };

      return recordHistory(state, { report, selectedIds: [component.id] }, {
        kind: 'addBand',
        targetId: bandId,
        label: `Adicionar lista de registros: ${dataSource}`,
      });
    }),

  addGroupedList: (config) =>
    set((state) => {
      const pageId = stateActivePageId(state);
      const page = stateActivePage(state);
      const base = getDefaultBandRect(page, 24, 0);
      // Empilha abaixo da última banda da folha (sem sobrepor o que já existe)
      const top = page.bands.reduce((max, bandId) => {
        const band = state.report.bands[bandId];
        if (!band) return max;
        const rect = getBandRect(band, page);
        return Math.max(max, rect.y + rect.height + 8);
      }, base.y);
      const groupRect = clampRectToPage({ ...base, y: top, height: 24 }, page);
      const itemRect = clampRectToPage({ ...base, y: groupRect.y + groupRect.height + 6, height: 20 }, page);

      const groupBandId = createId();
      const itemBandId = createId();
      const textComponent = (parentId: string, content: string, rect: ReportComponent['rect'], name: string): ReportComponent => ({
        id: createId(),
        type: 'text',
        name,
        parentId,
        rect,
        content,
        style: { fontSize: '12px', color: '#000000' },
      });

      const groupComponents = config.titleField
        ? [
            textComponent(
              groupBandId,
              `**{${config.groupDataSource}.${config.titleField}}**`,
              { x: 0, y: 2, width: groupRect.width, height: 20 },
              `Título do grupo (${config.groupLabel})`
            ),
          ]
        : [];
      const columnWidth = Math.floor(itemRect.width / Math.max(1, config.itemFields.length));
      const itemComponents = config.itemFields.map((field, index) =>
        textComponent(
          itemBandId,
          `{${config.itemDataSource}.${field}}`,
          { x: index * columnWidth, y: 0, width: columnWidth, height: 20 },
          `${config.itemLabel}: ${config.fieldLabels[field] ?? field}`
        )
      );

      const groupBand: ReportBand = {
        id: groupBandId,
        type: 'masterData',
        name: `Grupo: ${config.groupLabel}`,
        height: groupRect.height,
        bandRect: groupRect,
        dataSource: config.groupDataSource,
        dataLayout: 'list',
        components: groupComponents.map((component) => component.id),
      };
      const itemBand: ReportBand = {
        id: itemBandId,
        type: 'detailData',
        name: `${config.itemLabel} de cada grupo`,
        height: itemRect.height,
        bandRect: itemRect,
        dataSource: config.itemDataSource,
        dataLayout: 'list',
        autoHeight: true,
        link: {
          parentBandId: groupBandId,
          parentField: config.groupField,
          field: config.itemField,
          placement: 'below',
        },
        components: itemComponents.map((component) => component.id),
      };

      const components = { ...state.report.components };
      for (const component of [...groupComponents, ...itemComponents]) components[component.id] = component;

      const report = {
        ...state.report,
        components,
        bands: { ...state.report.bands, [groupBandId]: groupBand, [itemBandId]: itemBand },
        pages: state.report.pages.map((p) =>
          p.id === pageId ? { ...page, bands: [...page.bands, groupBandId, itemBandId] } : p
        ),
      };

      return recordHistory(state, { report, selectedIds: [itemBandId] }, {
        kind: 'addBand',
        targetId: groupBandId,
        label: `Adicionar lista agrupada: ${config.itemLabel} por ${config.groupLabel}`,
      });
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
