import { Minus, Plus } from 'lucide-react';
import React from 'react';
import { cn } from '../../../../../shared/ui/cn';
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
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { PropertyCheckbox, PropertyHint, PropertyTextInput } from '../controls/PropertyFields';
import type { ReportComponent } from '../../../../components/common/domain';

interface TablePropertiesSectionProps {
  component: ReportComponent;
  componentId: string;
  reportId: string;
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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
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
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-medium transition-colors',
        disabled
          ? 'cursor-not-allowed bg-neutral-50 text-neutral-300'
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70'
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {label}
    </button>
  );
}

export const TablePropertiesSection: React.FC<TablePropertiesSectionProps> = ({
  component,
  componentId,
  reportId,
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
    <div className="space-y-4">
      <PropertyCheckbox
        label="Primeira linha é o cabeçalho"
        checked={Boolean(tableProps.hasHeader)}
        onChange={(hasHeader) => patchTable({ ...tableProps, hasHeader })}
      />

      <div className="max-h-56 overflow-auto rounded-lg border border-neutral-200">
        <table className="w-full border-collapse text-[12px]">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="min-w-[72px] border-b border-r border-neutral-100 p-0 last:border-r-0">
                    <input
                      type="text"
                      value={cell}
                      list={fieldOptions.length > 0 ? `table-fields-${componentId}` : undefined}
                      onChange={(e) =>
                        patchTable(updateTableCell(tableProps, rowIndex, colIndex, e.target.value))
                      }
                      className={cn(
                        'w-full bg-transparent px-2 py-1.5 transition-colors hover:bg-neutral-50 focus:bg-weave-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-400',
                        tableProps.hasHeader && rowIndex === 0 && 'bg-neutral-50 font-semibold'
                      )}
                      placeholder={tableProps.hasHeader && rowIndex === 0 ? 'Cabeçalho' : 'Texto ou informação'}
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

      <div className="grid grid-cols-2 gap-1.5">
        <ToolbarButton label="Linha" icon={Plus} onClick={() => patchTable(addTableRow(tableProps))} />
        <ToolbarButton
          label="Linha"
          icon={Minus}
          disabled={rows.length <= 1}
          onClick={() => patchTable(removeTableRow(tableProps, rows.length - 1))}
        />
        <ToolbarButton label="Coluna" icon={Plus} onClick={() => patchTable(addTableColumn(tableProps))} />
        <ToolbarButton
          label="Coluna"
          icon={Minus}
          disabled={colCount <= 1}
          onClick={() => patchTable(removeTableColumn(tableProps, colCount - 1))}
        />
      </div>
      <PropertyHint>Digite direto nas células. Use “+” para acrescentar e “−” para remover a última linha ou coluna.</PropertyHint>

      <PropertyAccordion title="Avançado" sectionId="table-advanced" reportId={reportId} defaultOpen={false}>
        <PropertyTextInput
          label="Largura de cada coluna (px)"
          value={formatColumnWidthsInput(tableProps.columnWidths)}
          onChange={(raw) =>
            patchTable({ ...tableProps, columnWidths: parseColumnWidthsInput(raw, colCount) })
          }
          placeholder="100, 120, 80"
          hint="Separe por vírgula, uma largura por coluna."
        />
      </PropertyAccordion>
    </div>
  );
};
