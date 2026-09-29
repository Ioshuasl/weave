/** Perfil de layout da folha — define comportamento de preview/paginação */
export type PageLayoutProfile =
  | 'document'
  | 'label'
  | 'label-sheet'
  | 'continuous';

/** Unidade preferida na UI do designer (persistida no relatório) */
export type PageSizeUnit = 'px' | 'cm';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ReportPage {
  id: string;
  name: string;
  /** Preset built-in ou `custom` */
  presetId?: string;
  profile?: PageLayoutProfile;
  /** Unidade preferida no painel de propriedades */
  sizeUnit?: PageSizeUnit;
  /** Dimensões em px (fonte da verdade para render) */
  width: number;
  height: number;
  margins: PageMargins;
  bands: string[]; // Band IDs in vertical flow order
  /** Divisores/linhas com posição livre na folha */
  dividers?: string[];
  /** Fase 4 — grade de etiquetas */
  labelGrid?: {
    columns: number;
    rows: number;
    gapCm: number;
    labelWidthCm: number;
    labelHeightCm: number;
  };
}
