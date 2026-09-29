/** Banda/componente selecionado não deve ficar acima de overlays modais do designer. */
export function shouldSuppressDesignerCanvasZBoost(state: {
  textEditorModal: unknown;
  previewModalOpen: boolean;
}): boolean {
  return state.textEditorModal != null || state.previewModalOpen;
}
