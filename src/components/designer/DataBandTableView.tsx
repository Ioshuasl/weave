import React from 'react';
import type { DataTableProps, ReportBand } from '../../types/report';
import { resolveDataCellValue } from '../../utils/dataBandUtils';
import { cn } from '../../utils/cn';

interface DataBandTableViewProps {
  band: ReportBand;
  rows: Record<string, unknown>[];
  dataSource: string;
  previewRowLimit?: number;
  className?: string;
}

export const DataBandTableView: React.FC<DataBandTableViewProps> = ({
  band,
  rows,
  dataSource,
  previewRowLimit,
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

  const displayRows = previewRowLimit != null ? rows.slice(0, previewRowLimit) : rows;
  const hasMore = previewRowLimit != null && rows.length > previewRowLimit;

  return (
    <div className={cn('w-full h-full hide-scrollbar', className)}>
      <table
        className="w-full border-collapse table-fixed text-left"
        style={{ border: table.border ?? '1px solid #e5e5e5' }}
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
                  }}
                  className="border border-neutral-200/80 truncate hide-scrollbar"
                >
                  {resolveDataCellValue(col, row, dataSource)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <p className="text-[10px] text-neutral-400 text-center py-1">
          +{rows.length - previewRowLimit!} linhas na pré-visualização
        </p>
      )}
      {rows.length === 0 && (
        <p className="text-[10px] text-neutral-400 text-center py-2">Fonte de dados vazia</p>
      )}
    </div>
  );
};
