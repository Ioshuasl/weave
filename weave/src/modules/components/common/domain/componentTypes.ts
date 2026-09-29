import type { StyleDeclaration } from '../../../../shared/domain/style';
import type { Rect } from '../../../../shared/domain/geometry';

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
  style: StyleDeclaration;
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
