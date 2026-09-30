import type { StateCreator } from 'zustand';
import { getBandRect, applyDividerPositionUpdate } from '../../../../band/domain';
import { stylePreviewDebug } from '../../../../../shared/diagnostics/stylePreviewDebug';
import { getSelectedBandIds, getSelectedComponentsInBand } from '../../../domain/selectionUtils';
import { stateActivePage } from '../activePage';
import { recordHistory } from '../historyRecording';
import type { DesignerState } from '../designerState';
import type { DragSlice } from '../state/dragSlice.types';

export const createDragSlice: StateCreator<DesignerState, [], [], DragSlice> = (set) => ({
  draggingComponentId: null,
  componentGroupDrag: null,
  bandGroupDrag: null,
  dragPreviewRects: null,

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
});
