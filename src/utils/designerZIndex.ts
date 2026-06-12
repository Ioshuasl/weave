/** Overlay de modais do designer (acima do canvas, bandas e painéis). */
export const DESIGNER_MODAL_OVERLAY_Z = 5000;

/** Popups portaled (autocomplete, combobox) acima do overlay do modal. */
export const DESIGNER_MODAL_POPUP_Z = 5250;

/** Banda/componente selecionado não deve ficar acima de overlays modais do designer. */
export function shouldSuppressDesignerCanvasZBoost(state: {
  textEditorModal: unknown;
  previewModalOpen: boolean;
}): boolean {
  return state.textEditorModal != null || state.previewModalOpen;
}
