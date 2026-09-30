import { ReportDefinition, resolveActivePageId } from '../../../report/domain';
import { stylePreviewDebug } from '../../../../shared/diagnostics/stylePreviewDebug';
import { appendHistoryEntry, cloneData, cloneReport, type HistoryMeta } from '../../../history/domain';
import { resolveSelectionAfterRestore } from '../../domain/selectionUtils';
import type { DesignerState } from './designerState';

export function reportsEqual(a: ReportDefinition, b: ReportDefinition): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function dataEqual(a: Record<string, unknown[]>, b: Record<string, unknown[]>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function recordHistory<S extends DesignerState>(
  state: S,
  next: Partial<S>,
  meta: HistoryMeta
): S {
  const merged = { ...state, ...next } as S;
  if (reportsEqual(state.report, merged.report) && dataEqual(state.data, merged.data)) {
    return merged;
  }

  const { past, pointer } = appendHistoryEntry(
    state.historyPast,
    state.historyPointer,
    merged.report,
    merged.data,
    meta
  );

  stylePreviewDebug.countAction('history:record', { kind: meta.kind, label: meta.label });
  return { ...merged, historyPast: past, historyPointer: pointer };
}

export function restoreHistoryEntry(state: DesignerState, index: number): Partial<DesignerState> {
  const entry = state.historyPast[index];
  if (!entry) return state;

  stylePreviewDebug.countAction(index < state.historyPointer ? 'history:undo' : 'history:jump', {
    index,
    label: entry.label,
  });

  return {
    report: cloneReport(entry.report),
    data: cloneData(entry.data),
    historyPointer: index,
    selectedIds: resolveSelectionAfterRestore(state.selectedIds, entry.report),
    activePageId: resolveActivePageId(entry.report, state.activePageId),
    selectedPageId: null,
    liveStylePreview: null,
    liveChartPreview: null,
    draggingComponentId: null,
    canvasHoverId: null,
    componentGroupDrag: null,
    bandGroupDrag: null,
    dragPreviewRects: null,
    textEditorModal: null,
    previewModalOpen: false,
  };
}
