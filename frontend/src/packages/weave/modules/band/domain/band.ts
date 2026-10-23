import type { Rect } from '../../../shared/domain/geometry';
import type { BandCondition } from './bandCondition';
import type { BandFrame } from './bandFrame';
import type { BandLines } from './bandLines';
import type { StyleDeclaration } from '../../../shared/domain/style';

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

/** Posição das linhas da banda filha em relação à linha da banda pai */
export type BandLinkPlacement = 'above' | 'beside' | 'below';

/**
 * Vínculo mestre/detalhe: cada linha da banda pai repete as linhas filhas cujo `field`
 * é igual ao `parentField` do pai. Sem `parentField`, a filha usa a própria linha do pai (1:1).
 */
export interface BandLink {
  parentBandId: string;
  /** Campo da linha do pai usado na ligação (vazio = mesma linha do pai) */
  parentField?: string;
  /** Campo do dataset desta banda que deve ser igual ao campo do pai */
  field?: string;
  /** above = antes da linha do pai · beside = ao lado (mesma altura) · below = depois (padrão) */
  placement?: BandLinkPlacement;
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
  /** Vínculo mestre/detalhe com outra banda de dados */
  link?: BandLink;
  /** Mantém a linha, suas filhas "ao lado"/"depois" e as "antes" na mesma folha */
  keepTogether?: boolean;
  /** Linhas de divisão da lista (entre registros/colunas, contorno) — ver `bandLines.ts` */
  lines?: BandLines;
  /** Moldura em volta da banda e das filhas dela (lados ligáveis à parte) — ver `bandFrame.ts` */
  frame?: BandFrame;
  /** "Exibir somente se": linhas que não atendem à condição (e suas filhas) não são impressas */
  showWhen?: BandCondition;
  /** Altura de cada linha cresce conforme o texto (quebra de linha) */
  autoHeight?: boolean;
  /**
   * Elemento solto: banda invisível com um único componente, do tamanho dele.
   * O editor mostra só o componente; o tipo da banda define onde ele aparece
   * (reportTitle = 1ª folha, pageHeader/pageFooter = todas, reportSummary = fim).
   */
  element?: boolean;
  components: string[]; // Component IDs belonging to this band
}
