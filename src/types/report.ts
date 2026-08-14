import React from 'react';

export type Unit = 'px' | 'mm';

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

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ComponentType = 'text' | 'image' | 'qr' | 'shape' | 'line' | 'table' | 'chart';

/** Como a imagem preenche o retângulo do componente */
export type ImageSizeMode = 'contain' | 'cover' | 'fill';

export type ImageAlignX = 'left' | 'center' | 'right';
export type ImageAlignY = 'top' | 'middle' | 'bottom';

export interface ImageProps {
  /** Padrão: `contain` — relatórios antigos sem este campo continuam iguais */
  sizeMode?: ImageSizeMode;
  /** Texto alternativo (acessibilidade / PDF). Aceita `{dataset.campo}` */
  alt?: string;
  /** Padrão: `center` — posição horizontal quando Conter/Cobrir */
  alignX?: ImageAlignX;
  /** Padrão: `middle` — posição vertical quando Conter/Cobrir */
  alignY?: ImageAlignY;
  /** Trava largura/altura no painel e no resize (Shift também trava no canvas) */
  lockAspectRatio?: boolean;
  /** 0–1 — padrão 1. Valores baixos servem de marca d'água */
  opacity?: number;
  /** Rotação em graus (sentido horário). Padrão 0 */
  rotation?: number;
  /** URL ao clicar (preview/impressão). Aceita `{dataset.campo}` */
  href?: string;
  /** Ponto de recorte horizontal 0–100 (object-position). Sobrescreve alignX quando definido */
  cropX?: number;
  /** Ponto de recorte vertical 0–100 (object-position). Sobrescreve alignY quando definido */
  cropY?: number;
}

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QrProps {
  /** Padrão: `M` */
  errorCorrection?: QrErrorCorrection;
  foreground?: string;
  background?: string;
  /** Margem em módulos. Padrão: 1 */
  margin?: number;
}

/** @deprecated Legado — novos componentes usam markdown inline no content */
export type TextContentFormat = 'plain' | 'markdown' | 'html';

export interface ReportComponent {
  id: string;
  type: ComponentType;
  name: string;
  rect: Rect;
  content: string; // Texto com markdown inline, URL de imagem ou expressão {dataset.field}
  /** @deprecated Migrado automaticamente para markdown no content */
  textFormat?: TextContentFormat;
  style: React.CSSProperties;
  parentId: string; // Band ID
  imageProps?: ImageProps;
  qrProps?: QrProps;
  tableProps?: {
    rows: string[][]; // Content of cells [rowIndex][colIndex]
    columnWidths?: number[]; // Optional widths
    hasHeader?: boolean;
  };
  chartProps?: ChartProps;
}

export type ChartKind = 'bar' | 'pie';

export interface ChartProps {
  /** Padrão: `bar` — relatórios antigos sem este campo continuam como barras */
  chartKind?: ChartKind;
  dataset: string;
  /** Barras — categoria do eixo X */
  xAxisKey?: string;
  /** Barras — valor do eixo Y */
  yAxisKey?: string;
  barColor?: string;
  showGrid?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  /** Pizza — rótulo da fatia */
  nameKey?: string;
  /** Pizza — valor numérico da fatia */
  valueKey?: string;
  /** Pizza — raio interno em px (0 = pizza, >0 = donut) */
  innerRadius?: number;
  /** Pizza — limita quantidade de fatias exibidas (útil em listas longas) */
  maxSlices?: number;
  colorPalette?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  /** Legenda automática (Recharts) ou bloco rich text personalizado */
  legendMode?: 'auto' | 'custom';
  /** Markdown + campos `{dataset.campo}` — usado quando `legendMode` é `custom` */
  legendContent?: string;
  legendPosition?: 'top' | 'bottom';
  /** Título acima do gráfico (rich text) */
  titleContent?: string;
  /** Nome exibido na legenda automática de barras */
  seriesLabel?: string;
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  barStroke?: string;
  barStrokeWidth?: number;
}

export type BandType = 
  | 'reportTitle' 
  | 'reportSummary' 
  | 'pageHeader' 
  | 'pageFooter' 
  | 'masterData'
  | 'dataList'
  | 'dataListNumbered'
  | 'dataTable'
  | 'detailData'
  | 'divider';

/** @deprecated Preferir bandas dataList / dataListNumbered / dataTable */
export type DataBandLayout = 'list' | 'table';

export type NumberedListFormat = 'decimal-dot' | 'decimal-paren' | 'decimal';

export interface NumberedListProps {
  start?: number;
  format?: NumberedListFormat;
  width?: number;
  style?: React.CSSProperties;
}

export type BulletListMarker =
  | 'circle-filled'
  | 'circle-outline'
  | 'square-filled'
  | 'none';

export interface BulletListProps {
  marker?: BulletListMarker;
  /** Largura da coluna do marcador (px) — conteúdo começa após este valor */
  width?: number;
  color?: string;
  /** Tamanho do marcador (px) */
  size?: number;
}

/** Extremidades da linha divisória em coordenadas locais da banda (px) */
export interface DividerLineVector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DataTableColumn {
  id: string;
  field: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: string;
  headerStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
}

export interface DataTableProps {
  showHeader?: boolean;
  border?: string;
  headerStyle?: React.CSSProperties;
  rowStyle?: React.CSSProperties;
  alternateRowStyle?: React.CSSProperties;
  columns: DataTableColumn[];
}

export interface ReportBand {
  id: string;
  type: BandType;
  name: string;
  height: number;
  dataSource?: string; // For data bands
  /** @deprecated Legado masterData — use o tipo da banda (dataList, dataTable, etc.) */
  dataLayout?: DataBandLayout;
  dataTable?: DataTableProps;
  /** Configuração da numeração automática (banda dataListNumbered) */
  numberedList?: NumberedListProps;
  /** Marcadores visuais por linha (banda dataList) */
  bulletList?: BulletListProps;
  dividerColor?: string;
  /** Extremidades vetoriais (preferencial). Coordenadas relativas ao canto da banda. */
  dividerLine?: DividerLineVector;
  /** Graus derivados da linha vetorial — mantido para compatibilidade e painel */
  dividerAngle?: number;
  dividerThickness?: number;
  /** Posição e tamanho na folha (área dentro das margens) */
  bandRect?: Rect;
  /** @deprecated use bandRect */
  dividerRect?: Rect;
  components: string[]; // Component IDs belonging to this band
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

export interface ReportDefinition {
  id: string;
  name: string;
  pages: ReportPage[];
  bands: Record<string, ReportBand>;
  components: Record<string, ReportComponent>;
}

export interface ReportData {
  [key: string]: any[];
}
