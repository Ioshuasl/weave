import type { TextEditorModalDraft, TextEditorModalState } from '../../../domain/textEditorModal';

export interface TextEditorSlice {
  /** Modal de edição de texto (duplo-clique no canvas) */
  textEditorModal: TextEditorModalState | null;

  openTextEditorModal: (componentId: string) => void;
  closeTextEditorModal: () => void;
  patchTextEditorDraft: (patch: Partial<TextEditorModalDraft>) => void;
  commitTextEditorModal: () => void;
}
