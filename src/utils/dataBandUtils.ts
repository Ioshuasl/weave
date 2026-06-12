import type {
  BulletListMarker,
  BulletListProps,
  DataTableColumn,
  DataTableProps,
  NumberedListFormat,
  NumberedListProps,
  ReportBand,
  ReportData,
} from '../types/report';
import { evaluateExpression } from './reportUtils';

export function buildColumnsFromDataset(
  dataSource: string,
  data: ReportData
): DataTableColumn[] {
  const rows = data[dataSource];
  if (!rows?.length) return [];

  return Object.keys(rows[0]).map((field) => ({
    id: field,
    field,
    header: field.charAt(0).toUpperCase() + field.slice(1),
    align: 'left' as const,
    format: `{${dataSource}.${field}}`,
  }));
}

export function getDefaultDataTable(
  dataSource: string,
  data: ReportData
): DataTableProps {
  return {
    showHeader: true,
    border: '1px solid #e5e5e5',
    headerStyle: {
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: '#f5f5f5',
      padding: '6px 8px',
    },
    rowStyle: {
      fontSize: '12px',
      padding: '4px 8px',
    },
    alternateRowStyle: {
      backgroundColor: '#fafafa',
    },
    columns: buildColumnsFromDataset(dataSource, data),
  };
}

export function resolveDataCellValue(
  column: DataTableColumn,
  row: Record<string, unknown>,
  dataSource: string
): string {
  const expression = column.format ?? `{${dataSource}.${column.field}}`;
  return evaluateExpression(expression, row);
}

const DATA_BAND_TYPES = new Set([
  'masterData',
  'dataList',
  'dataListNumbered',
  'dataTable',
  'detailData',
]);

export function isDataBand(type: string): boolean {
  return DATA_BAND_TYPES.has(type);
}

export function isNumberedListBand(band: ReportBand | string): boolean {
  const type = typeof band === 'string' ? band : band.type;
  return type === 'dataListNumbered';
}

export function isBulletListBand(band: ReportBand | string): boolean {
  const type = typeof band === 'string' ? band : band.type;
  return type === 'dataList';
}

export function isTableDataBand(band: ReportBand | string): boolean {
  const type = typeof band === 'string' ? band : band.type;
  if (type === 'dataTable') return true;
  if (typeof band !== 'string' && band.type === 'masterData') {
    return band.dataLayout === 'table';
  }
  return false;
}

export function isListDataBand(band: ReportBand | string): boolean {
  const type = typeof band === 'string' ? band : band.type;
  if (type === 'dataList' || type === 'dataListNumbered') return true;
  if (typeof band !== 'string' && band.type === 'masterData') {
    return band.dataLayout !== 'table';
  }
  return type === 'detailData';
}

export function getNumberedListColumnWidth(band: ReportBand): number {
  return band.numberedList?.width ?? 28;
}

export function getDefaultBulletList(): BulletListProps {
  return {
    marker: 'none',
    width: 20,
    color: '#404040',
    size: 6,
  };
}

export function resolveBulletListConfig(config?: BulletListProps): BulletListProps {
  return { ...getDefaultBulletList(), ...config };
}

export function resolveBulletList(band: ReportBand): BulletListProps {
  return resolveBulletListConfig(band.bulletList);
}

export function getBulletListColumnWidth(band: ReportBand): number {
  const config = resolveBulletList(band);
  if (config.marker === 'none') return 0;
  return config.width ?? 20;
}

/** Recuo horizontal do conteúdo da linha (coluna de número ou marcador) */
export function getListRowContentInset(band: ReportBand): number {
  if (isNumberedListBand(band)) return getNumberedListColumnWidth(band);
  if (isBulletListBand(band)) return getBulletListColumnWidth(band);
  return 0;
}

export function getListRowMarkerKind(band: ReportBand): 'number' | 'bullet' | null {
  if (isNumberedListBand(band)) return 'number';
  if (isBulletListBand(band) && resolveBulletList(band).marker !== 'none') {
    return 'bullet';
  }
  return null;
}

export const BULLET_LIST_MARKER_LABELS: Record<BulletListMarker, string> = {
  'circle-filled': 'Círculo preenchido',
  'circle-outline': 'Círculo vazio',
  'square-filled': 'Quadrado preenchido',
  none: 'Sem marcador',
};

export function getDefaultNumberedList(): NumberedListProps {
  return {
    start: 1,
    format: 'decimal-dot',
    width: 28,
    style: {
      fontSize: '12px',
      color: '#525252',
      fontWeight: '500',
    },
  };
}

export function formatRowNumber(
  rowIndex: number,
  config?: NumberedListProps
): string {
  const start = config?.start ?? 1;
  const format: NumberedListFormat = config?.format ?? 'decimal-dot';
  const n = start + rowIndex;

  switch (format) {
    case 'decimal-paren':
      return `${n})`;
    case 'decimal':
      return `${n}`;
    default:
      return `${n}.`;
  }
}

export function getBandDisplayLabel(type: string): string {
  const labels: Record<string, string> = {
    reportTitle: 'Título',
    pageHeader: 'Cabeçalho',
    masterData: 'Dados',
    dataList: 'Lista livre',
    dataListNumbered: 'Lista numerada',
    dataTable: 'Tabela',
    detailData: 'Detalhe',
    divider: 'Linha',
    pageFooter: 'Rodapé',
    reportSummary: 'Resumo',
  };
  return labels[type] ?? type;
}

export function getDefaultDataSource(data: ReportData): string {
  const keys = Object.keys(data);
  return keys[0] ?? '';
}

/** Quantidade de linhas de dados exibidas no canvas (modo lista) */
export const DESIGNER_LIST_GHOST_ROW_LIMIT = 3;

export function getDesignerListPreviewRowCount(rowCount: number, hasComponents: boolean): number {
  if (!hasComponents) return 1;
  if (rowCount <= 0) return 1;
  return Math.min(DESIGNER_LIST_GHOST_ROW_LIMIT, rowCount);
}
