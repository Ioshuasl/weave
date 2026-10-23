import { getBandRect } from '../../../../band/domain';
import { getComponentDisplayLabel } from '../../../../components/common/domain';
import {
  buildLoosePasteFromClipboard,
  buildPasteFromClipboard,
  canBandAcceptPastedComponents,
  componentToClipboardPayload,
  resolvePasteTargetBandId,
} from '../../../domain/designerClipboard';
import { getPrimarySelectedId, getSelectedComponentIds } from '../../../domain/selectionUtils';
import { stateActivePage } from '../activePage';
import { recordHistory } from '../historyRecording';
import type { DesignerState } from '../designerState';
import type { ClipboardSlice } from '../state/clipboardSlice.types';
import type { StateCreator } from 'zustand';

export const createClipboardSlice: StateCreator<DesignerState, [], [], ClipboardSlice> = (set) => ({
  clipboard: null,

  copySelected: () =>
    set((state) => {
      const componentIds = getSelectedComponentIds(state.selectedIds, state.report);
      if (componentIds.length === 0) return state;

      const first = state.report.components[componentIds[0]];
      if (!first) return state;
      const page = stateActivePage(state);

      return {
        clipboard: {
          sourceBandId: first.parentId,
          items: componentIds
            .map((id) => state.report.components[id])
            .filter(Boolean)
            .map((comp) => {
              const band = state.report.bands[comp.parentId];
              const origin = band ? getBandRect(band, page) : { x: 0, y: 0 };
              return {
                ...componentToClipboardPayload(comp),
                pageX: origin.x + comp.rect.x,
                pageY: origin.y + comp.rect.y,
              };
            }),
        },
      };
    }),

  pasteToTargetBand: (targetBandId) =>
    set((state) => {
      const { clipboard, report, selectedIds } = state;
      if (!clipboard || clipboard.items.length === 0) return state;

      const resolvedTarget =
        targetBandId ?? resolvePasteTargetBandId(report, getPrimarySelectedId(selectedIds));
      const targetBand = resolvedTarget ? report.bands[resolvedTarget] : undefined;

      // Sem bloco de destino (ou elemento solto selecionado): cola como elementos soltos na folha
      const built =
        !resolvedTarget || targetBand?.element
          ? buildLoosePasteFromClipboard(report, clipboard, state.activePageId)
          : canBandAcceptPastedComponents(targetBand)
            ? buildPasteFromClipboard(report, clipboard, resolvedTarget)
            : null;
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
