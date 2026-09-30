import type { StateCreator } from 'zustand';
import { getComponentDisplayLabel } from '../../../../components/common/domain';
import { buildPasteFromClipboard, canBandAcceptPastedComponents, componentToClipboardPayload, resolvePasteTargetBandId } from '../../../domain/designerClipboard';
import { getPrimarySelectedId, getSelectedComponentIds } from '../../../domain/selectionUtils';
import { recordHistory } from '../historyRecording';
import type { DesignerState } from '../designerState';
import type { ClipboardSlice } from '../state/clipboardSlice.types';

export const createClipboardSlice: StateCreator<DesignerState, [], [], ClipboardSlice> = (set) => ({
  clipboard: null,

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
});
