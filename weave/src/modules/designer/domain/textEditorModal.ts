import type { StyleDeclaration } from '../../../shared/domain/style';


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
  style: StyleDeclaration,
  draft: TextEditorModalDraft | null | undefined
): StyleDeclaration {
  if (!draft) return style;
  return {
    ...style,
    fontSize: draft.fontSize,
    color: draft.color,
    textAlign: draft.textAlign,
    padding: draft.padding || undefined,
  };
}

export type TextEditorModalTextAlign = 'left' | 'center' | 'right';

export interface TextEditorModalDraft {
  content: string;
  fontSize: string;
  color: string;
  textAlign: TextEditorModalTextAlign;
  padding: string;
}

export interface TextEditorModalState {
  componentId: string;
  draft: TextEditorModalDraft;
  initialDraft: TextEditorModalDraft;
}
