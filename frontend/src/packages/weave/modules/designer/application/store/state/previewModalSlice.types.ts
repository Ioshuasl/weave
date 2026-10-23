export interface PreviewModalSlice {
  /** Pré-visualização modal aberta sobre o canvas */
  previewModalOpen: boolean;

  /** Painel de cálculos aberto sobre o canvas */
  calculosPanelOpen: boolean;

  setPreviewModalOpen: (open: boolean) => void;
  setCalculosPanelOpen: (open: boolean) => void;
}
