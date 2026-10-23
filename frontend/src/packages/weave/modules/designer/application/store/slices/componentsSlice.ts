import { stylePreviewDebug } from '../../../../../shared/diagnostics/stylePreviewDebug';
import { getBandRect } from '../../../../band/domain';
import { ReportComponent, getComponentDisplayLabel, squareQrRect } from '../../../../components/common/domain';
import { describeComponentUpdate } from '../../../../history/domain';
import { ARRANGE_MODE_LABELS, arrangeRects } from '../../../domain/componentArrangement';
import { buildNewComponent } from '../../../domain/componentFactory';
import { buildComponentDuplicate } from '../../../domain/designerDuplicate';
import { stateActivePage } from '../activePage';
import { recordHistory } from '../historyRecording';
import { filterSelection } from '../selectionFilters';
import type { DesignerState } from '../designerState';
import type { ComponentsSlice } from '../state/componentsSlice.types';
import type { StateCreator } from 'zustand';

export const createComponentsSlice: StateCreator<DesignerState, [], [], ComponentsSlice> = (set) => ({
  addComponent: (bandId, type, initialProps, bandUpdates) => set((state) => {
    const newComp = buildNewComponent(bandId, type, initialProps);
    const newCompId = newComp.id;

    const report = {
      ...state.report,
      components: { ...state.report.components, [newCompId]: newComp },
      bands: {
        ...state.report.bands,
        [bandId]: {
          ...state.report.bands[bandId],
          ...bandUpdates,
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

  arrangeComponents: (mode, ids) =>
    set((state) => {
      // Elementos soltos ficam em bandas próprias: alinha em coordenadas da folha
      const page = stateActivePage(state);
      const offsetOf = (component: ReportComponent) => {
        const band = state.report.bands[component.parentId];
        return band?.element ? getBandRect(band, page) : { x: 0, y: 0 };
      };
      const items = ids
        .map((id) => state.report.components[id])
        .filter((component): component is ReportComponent => Boolean(component))
        .map((component) => {
          const offset = offsetOf(component);
          return {
            id: component.id,
            rect: { ...component.rect, x: component.rect.x + offset.x, y: component.rect.y + offset.y },
          };
        });
      const updates = arrangeRects(mode, items);
      if (updates.length === 0) return state;

      const components = { ...state.report.components };
      for (const { id, rect } of updates) {
        const offset = offsetOf(components[id]);
        components[id] = {
          ...components[id],
          rect: {
            ...components[id].rect,
            ...rect,
            ...(rect.x !== undefined ? { x: rect.x - offset.x } : {}),
            ...(rect.y !== undefined ? { y: rect.y - offset.y } : {}),
          },
        };
      }

      return recordHistory(state, { report: { ...state.report, components } }, {
        kind: 'updateComponent',
        targetId: updates[0].id,
        label: ARRANGE_MODE_LABELS[mode],
      });
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
