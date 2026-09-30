export interface PreviewModalSlice {
  /** Pré-visualização modal aberta sobre o canvas */
  previewModalOpen: boolean;

  setPreviewModalOpen: (open: boolean) => void;
}
