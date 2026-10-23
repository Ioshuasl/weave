import React from 'react';
import { cn } from '../../../shared/ui/cn';
import { getBandLinesThicknessPx, hasBandLines } from '../domain/bandLines';
import { resolveDataCellValue } from '../domain/dataBandUtils';
import type { DataTableColumn, ReportBand } from '../domain/band';

interface DataBandTableViewProps {
  band: ReportBand;
  rows: Record<string, unknown>[];
  dataSource: string;
  previewRowLimit?: number;
  /** design = tokens/molde; preview = dados resolvidos */
  variant?: 'design' | 'preview';
  className?: string;
}

function columnTemplateToken(column: DataTableColumn, dataSource: string): string {
  return column.format ?? `{${dataSource}.${column.field}}`;
}

export const DataBandTableView: React.FC<DataBandTableViewProps> = ({
  band,
  rows,
  dataSource,
  previewRowLimit,
  variant = 'preview',
  className,
}) => {
  const table = band.dataTable;
  if (!table?.columns.length) {
    return (
      <div className={cn('flex items-center justify-center h-full text-xs text-neutral-400 p-4', className)}>
        Configure as colunas no painel de propriedades
      </div>
    );
  }

  const isDesign = variant === 'design';
  // Linhas escolhidas pelo usuário ("Linhas da lista") substituem a grade cinza padrão
  const lines = hasBandLines(band.lines) ? band.lines : undefined;
  const lineBorder = lines ? `${getBandLinesThicknessPx(lines)}px solid ${lines.color ?? '#000000'}` : undefined;
  const cellLines: React.CSSProperties | undefined = lines
    ? {
        borderBottom: lines.rows || lines.outline ? lineBorder : 'none',
        borderRight: lines.columns || lines.sides || lines.outline ? lineBorder : 'none',
        borderTop: 'none',
        borderLeft: 'none',
      }
    : undefined;
  const displayRows = isDesign
    ? [{}]
    : previewRowLimit != null
      ? rows.slice(0, previewRowLimit)
      : rows;
  const hasMore = !isDesign && previewRowLimit != null && rows.length > previewRowLimit;

  return (
    <div className={cn('w-full h-full hide-scrollbar', className)}>
      <table
        className="w-full border-collapse table-fixed text-left"
        style={lines ? { border: 'none', borderLeft: lines.sides || lines.outline ? lineBorder : 'none' } : { border: table.border ?? '1px solid #e5e5e5' }}
      >
        {table.showHeader !== false && (
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th
                  key={col.id}
                  style={{
                    width: col.width,
                    textAlign: col.align ?? 'left',
                    ...table.headerStyle,
                    ...col.headerStyle,
                    ...cellLines,
                    ...(lines ? { borderTop: lineBorder } : undefined),
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                ...table.rowStyle,
                ...(rowIndex % 2 === 1 ? table.alternateRowStyle : undefined),
              }}
            >
              {table.columns.map((col) => (
                <td
                  key={col.id}
                  style={{
                    textAlign: col.align ?? 'left',
                    ...col.cellStyle,
                    ...cellLines,
                  }}
                  className={cn('truncate hide-scrollbar', !lines && 'border border-neutral-200/80')}
                >
                  {isDesign
                    ? columnTemplateToken(col, dataSource)
                    : resolveDataCellValue(col, row, dataSource)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <p className="text-[10px] text-neutral-400 text-center py-1">
          +{rows.length - previewRowLimit} linhas na pré-visualização
        </p>
      )}
      {!isDesign && rows.length === 0 && (
        <p className="text-[10px] text-neutral-400 text-center py-2">Fonte de dados vazia</p>
      )}
    </div>
  );
};
