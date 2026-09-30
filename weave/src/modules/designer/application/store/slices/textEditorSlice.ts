import type { StateCreator } from 'zustand';
import { ReportComponent } from '../../../../components/common/domain';
import { describeComponentUpdate } from '../../../../history/domain';
import { isTextEditorModalDirty } from '../../../domain/textEditorModal';
import type { TextEditorModalDraft, TextEditorModalTextAlign } from '../../../domain/textEditorModal';
import { recordHistory } from '../historyRecording';
import type { DesignerState } from '../designerState';
import type { TextEditorSlice } from '../state/textEditorSlice.types';

function buildTextEditorDraftFromComponent(component: ReportComponent): TextEditorModalDraft {
  return {
    content: component.content,
    fontSize: String(component.style.fontSize || '14px'),
    color: String(component.style.color || '#000000'),
    textAlign: (component.style.textAlign as TextEditorModalTextAlign) || 'left',
    padding: String(component.style.padding || ''),
  };
}

export const createTextEditorSlice: StateCreator<DesignerState, [], [], TextEditorSlice> = (set) => ({
  textEditorModal: null,

  openTextEditorModal: (componentId) =>
    set((state) => {
      const component = state.report.components[componentId];
      if (!component || component.type !== 'text') return state;

      const existing = state.textEditorModal;
      if (existing) {
        if (existing.componentId === componentId) return state;
        if (isTextEditorModalDirty(existing)) return state;
      }

      const draft = buildTextEditorDraftFromComponent(component);
      return {
        textEditorModal: {
          componentId,
          draft: { ...draft },
          initialDraft: { ...draft },
        },
      };
    }),

  closeTextEditorModal: () =>
    set((state) => {
      if (state.textEditorModal === null) return state;
      return { textEditorModal: null };
    }),

  patchTextEditorDraft: (patch) =>
    set((state) => {
      if (!state.textEditorModal) return state;
      return {
        textEditorModal: {
          ...state.textEditorModal,
          draft: { ...state.textEditorModal.draft, ...patch },
        },
      };
    }),

  commitTextEditorModal: () =>
    set((state) => {
      const modal = state.textEditorModal;
      if (!modal) return state;

      const current = state.report.components[modal.componentId];
      if (!current) {
        return { textEditorModal: null };
      }

      const { content, fontSize, color, textAlign, padding } = modal.draft;
      const updates: Partial<ReportComponent> = {
        content,
        style: {
          ...current.style,
          fontSize,
          color,
          textAlign,
          padding: padding || undefined,
        },
      };

      const report = {
        ...state.report,
        components: {
          ...state.report.components,
          [modal.componentId]: { ...current, ...updates },
        },
      };

      return recordHistory(
        state,
        { report, textEditorModal: null },
        describeComponentUpdate(modal.componentId, updates, current)
      );
    }),
});
