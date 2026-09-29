import type { StyleDeclaration } from '../../../shared/domain/style';
import type { Rect } from '../../../shared/domain/geometry';

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
  style?: StyleDeclaration;
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
  headerStyle?: StyleDeclaration;
  cellStyle?: StyleDeclaration;
}

export interface DataTableProps {
  showHeader?: boolean;
  border?: string;
  headerStyle?: StyleDeclaration;
  rowStyle?: StyleDeclaration;
  alternateRowStyle?: StyleDeclaration;
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
