import type { CSSProperties } from 'react';
import type { TextEditorModalDraft, TextEditorModalState } from '../store/designerStore';

export function textEditorDraftsEqual(
  a: TextEditorModalDraft,
  b: TextEditorModalDraft
): boolean {
  return (
    a.content === b.content &&
    a.fontSize === b.fontSize &&
    a.color === b.color &&
    a.textAlign === b.textAlign &&
    a.padding === b.padding
  );
}

export function isTextEditorModalDirty(modal: TextEditorModalState): boolean {
  return !textEditorDraftsEqual(modal.draft, modal.initialDraft);
}

/** Aplica tipografia do draft do modal sobre o estilo persistido (preview WYSIWYG no canvas). */
export function mergeTextEditorDraftStyle(
  style: CSSProperties,
  draft: TextEditorModalDraft | null | undefined
): CSSProperties {
  if (!draft) return style;
  return {
    ...style,
    fontSize: draft.fontSize,
    color: draft.color,
    textAlign: draft.textAlign,
    padding: draft.padding || undefined,
  };
}
