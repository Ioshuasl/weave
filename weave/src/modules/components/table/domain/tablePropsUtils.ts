import type { ReportComponent } from '../../common/domain';

export type TableProps = NonNullable<ReportComponent['tableProps']>;

export function ensureTableRows(rows: string[][]): string[][] {
  if (!rows.length) return [['']];
  const colCount = Math.max(1, ...rows.map((r) => r.length));
  return rows.map((row) => {
    const next = [...row];
    while (next.length < colCount) next.push('');
    return next.slice(0, colCount);
  });
}

export function updateTableCell(
  tableProps: TableProps,
  rowIndex: number,
  colIndex: number,
  value: string
): TableProps {
  const rows = ensureTableRows(tableProps.rows.map((r) => [...r]));
  rows[rowIndex][colIndex] = value;
  return { ...tableProps, rows };
}

export function addTableRow(tableProps: TableProps): TableProps {
  const rows = ensureTableRows(tableProps.rows.map((r) => [...r]));
  const colCount = rows[0]?.length ?? 1;
  rows.push(Array.from({ length: colCount }, () => ''));
  return { ...tableProps, rows };
}

export function removeTableRow(tableProps: TableProps, rowIndex: number): TableProps {
  const rows = ensureTableRows(tableProps.rows.map((r) => [...r]));
  if (rows.length <= 1) return tableProps;
  rows.splice(rowIndex, 1);
  return { ...tableProps, rows };
}

export function addTableColumn(tableProps: TableProps): TableProps {
  const rows = ensureTableRows(tableProps.rows.map((r) => [...r]));
  const next: TableProps = {
    ...tableProps,
    rows: rows.map((row) => [...row, '']),
  };
  if (tableProps.columnWidths?.length) {
    const last = tableProps.columnWidths[tableProps.columnWidths.length - 1] ?? 80;
    next.columnWidths = [...tableProps.columnWidths, last];
  }
  return next;
}

export function removeTableColumn(tableProps: TableProps, colIndex: number): TableProps {
  const rows = ensureTableRows(tableProps.rows.map((r) => [...r]));
  if ((rows[0]?.length ?? 0) <= 1) return tableProps;
  return {
    ...tableProps,
    rows: rows.map((row) => row.filter((_, i) => i !== colIndex)),
    columnWidths: tableProps.columnWidths?.filter((_, i) => i !== colIndex),
  };
}

export function parseColumnWidthsInput(value: string, colCount: number): number[] | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parts = trimmed.split(',').map((p) => Number(p.trim()));
  if (parts.some((n) => !Number.isFinite(n) || n <= 0)) return undefined;
  while (parts.length < colCount) parts.push(parts[parts.length - 1] ?? 80);
  return parts.slice(0, colCount);
}

export function formatColumnWidthsInput(widths?: number[]): string {
  return widths?.length ? widths.join(', ') : '';
}
