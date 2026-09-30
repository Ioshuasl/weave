import type { StateCreator } from 'zustand';
import { createId } from '../../../../../shared/domain/id';
import { ReportComponent, getComponentDisplayLabel, getDefaultComponentSize, squareQrRect } from '../../../../components/common/domain';
import { DEFAULT_IMAGE_PLACEHOLDER_SRC } from '../../../../components/image/domain';
import { stylePreviewDebug } from '../../../../../shared/diagnostics/stylePreviewDebug';
import { describeComponentUpdate } from '../../../../history/domain';
import { buildComponentDuplicate } from '../../../domain/designerDuplicate';
import { filterSelection } from '../selectionFilters';
import { recordHistory } from '../historyRecording';
import type { DesignerState } from '../designerState';
import type { ComponentsSlice } from '../state/componentsSlice.types';

export const createComponentsSlice: StateCreator<DesignerState, [], [], ComponentsSlice> = (set) => ({
  addComponent: (bandId, type, initialProps) => set((state) => {
    const newCompId = createId();
    
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
});
