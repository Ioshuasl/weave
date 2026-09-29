import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { ReportComponent } from '../../../../components/common/domain';
import {
  addTableColumn,
  addTableRow,
  ensureTableRows,
  formatColumnWidthsInput,
  parseColumnWidthsInput,
  removeTableColumn,
  removeTableRow,
  updateTableCell,
} from '../../../../components/table/domain';
import {
  PropertyCheckbox,
  PropertyFieldGrid,
  PropertyHint,
  PropertyTextInput,
} from '../controls/PropertyFields';
import { cn } from '../../../../../shared/ui/cn';

interface TablePropertiesSectionProps {
  component: ReportComponent;
  componentId: string;
  fieldOptions: { label: string; value: string }[];
  onUpdate: (updates: Partial<ReportComponent>) => void;
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors',
        disabled
          ? 'border-neutral-100 text-neutral-300 cursor-not-allowed'
          : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
      )}
    >
      <Icon className="w-3 h-3" strokeWidth={2} />
      {label}
    </button>
  );
}

export const TablePropertiesSection: React.FC<TablePropertiesSectionProps> = ({
  component,
  componentId,
  fieldOptions,
  onUpdate,
}) => {
  const tableProps = component.tableProps;
  if (!tableProps) return null;

  const rows = ensureTableRows(tableProps.rows);
  const colCount = rows[0]?.length ?? 1;

  const patchTable = (next: typeof tableProps) => {
    onUpdate({ tableProps: next });
  };

  return (
    <div className="space-y-3">
      <PropertyCheckbox
        label="Primeira linha como cabeçalho"
        checked={Boolean(tableProps.hasHeader)}
        onChange={(hasHeader) => patchTable({ ...tableProps, hasHeader })}
      />

      <div className="overflow-auto max-h-56 rounded-md border border-neutral-200">
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border-b border-r border-neutral-100 p-0 min-w-[72px]">
                    <input
                      type="text"
                      value={cell}
                      list={
                        fieldOptions.length > 0
                          ? `table-fields-${componentId}`
                          : undefined
                      }
                      onChange={(e) =>
                        patchTable(
                          updateTableCell(tableProps, rowIndex, colIndex, e.target.value)
                        )
                      }
                      className={cn(
                        'w-full px-1.5 py-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-neutral-300',
                        tableProps.hasHeader && rowIndex === 0 && 'font-semibold bg-neutral-50/80'
                      )}
                      placeholder={
                        tableProps.hasHeader && rowIndex === 0
                          ? 'Cabeçalho'
                          : '{dataset.campo}'
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fieldOptions.length > 0 && (
        <datalist id={`table-fields-${componentId}`}>
          {fieldOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </datalist>
      )}

      <div className="flex flex-wrap gap-1.5">
        <ToolbarButton
          label="Linha"
          icon={Plus}
          onClick={() => patchTable(addTableRow(tableProps))}
        />
        <ToolbarButton
          label="Linha"
          icon={Minus}
          disabled={rows.length <= 1}
          onClick={() => patchTable(removeTableRow(tableProps, rows.length - 1))}
        />
        <ToolbarButton
          label="Coluna"
          icon={Plus}
          onClick={() => patchTable(addTableColumn(tableProps))}
        />
        <ToolbarButton
          label="Coluna"
          icon={Minus}
          disabled={colCount <= 1}
          onClick={() => patchTable(removeTableColumn(tableProps, colCount - 1))}
        />
      </div>

      <PropertyFieldGrid>
        <PropertyTextInput
          label="Larguras das colunas (px)"
          value={formatColumnWidthsInput(tableProps.columnWidths)}
          onChange={(raw) =>
            patchTable({
              ...tableProps,
              columnWidths: parseColumnWidthsInput(raw, colCount),
            })
          }
          placeholder="100, 120, 80"
        />
      </PropertyFieldGrid>

      <PropertyHint>
        Use texto fixo ou expressões como {'{users.name}'} nas células. O cabeçalho aceita rótulos
        estáticos.
      </PropertyHint>
    </div>
  );
};
