import { AnimatePresence, motion } from 'framer-motion';
import { AlignCenter, AlignLeft, AlignRight, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { createId } from '../../../../../shared/domain/id';
import { type DataTableColumn } from '../../../../band/domain';
import { PropertyCombobox } from '../controls/PropertyCombobox';
import {
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
  PropertyTextInput,
} from '../controls/PropertyFields';
import { PropertySortableList } from '../controls/PropertySortableList';

const ALIGN_OPTIONS = [
  { value: 'left' as const, label: '', icon: AlignLeft, title: 'Alinhar à esquerda' },
  { value: 'center' as const, label: '', icon: AlignCenter, title: 'Centralizar' },
  { value: 'right' as const, label: '', icon: AlignRight, title: 'Alinhar à direita' },
];

const parseWidth = (width?: string) => ({
  fixed: Boolean(width),
  amount: Math.round(parseFloat(width ?? '') || 100),
  unit: width?.trim().endsWith('%') ? '%' : 'px',
});

/** Colunas da tabela: uma linha por coluna (arraste para ordenar, clique para ajustar). */
export function TableColumnsEditor({
  columns,
  dataSource,
  fieldOptions,
  onChange,
}: {
  columns: DataTableColumn[];
  dataSource: string;
  fieldOptions: { label: string; value: string }[];
  onChange: (columns: DataTableColumn[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const fieldLabel = (field: string) => fieldOptions.find((option) => option.value === field)?.label ?? field;
  const token = (field: string) => (dataSource ? `{${dataSource}.${field}}` : '');

  const patchColumn = (id: string, patch: Partial<DataTableColumn>) =>
    onChange(columns.map((column) => (column.id === id ? { ...column, ...patch } : column)));

  const addColumn = (field: string) => {
    const column: DataTableColumn = {
      id: createId(),
      field,
      header: fieldLabel(field),
      align: 'left',
      format: token(field),
    };
    onChange([...columns, column]);
    setOpenId(column.id);
  };

  const renderColumn = (id: string, controls: Parameters<Parameters<typeof PropertySortableList>[0]['renderItem']>[1]) => {
    const column = columns.find((item) => item.id === id);
    if (!column) return null;
    const isOpen = openId === id;
    const width = parseWidth(column.width);

    return (
      <div className="rounded-lg border border-neutral-200 bg-weave-surface">
        <div className="flex items-center gap-1 px-1.5 py-1.5">
          <span
            role="presentation"
            onPointerDown={(event) => controls.start(event)}
            className="flex size-5 shrink-0 cursor-grab touch-none items-center justify-center text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
            title="Arraste para mudar a ordem"
          >
            <GripVertical className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <input
              value={column.header}
              aria-label="Título da coluna"
              placeholder="Título da coluna"
              onChange={(event) => patchColumn(id, { header: event.target.value })}
              className="w-full truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[13px] font-medium text-neutral-900 outline-none transition-colors hover:bg-neutral-100 focus:border-indigo-500 focus:bg-weave-surface"
            />
            <p className="truncate px-1.5 text-[11px] text-neutral-500">{fieldLabel(column.field)}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpenId(isOpen ? null : id)}
            aria-expanded={isOpen}
            title="Ajustar coluna"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }} className="flex">
              <ChevronRight className="size-4" />
            </motion.span>
          </button>
          <button
            type="button"
            onClick={() => onChange(columns.filter((item) => item.id !== id))}
            title="Remover coluna"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-neutral-100 px-3 py-3">
                <PropertyCombobox
                  label="Informação mostrada"
                  value={column.field}
                  onChange={(field) => patchColumn(id, { field, format: token(field) || column.format })}
                  options={fieldOptions}
                  placeholder="Escolha uma informação…"
                  searchPlaceholder="Buscar…"
                />
                <PropertySegmentedControl
                  label="Alinhamento do texto"
                  value={column.align ?? 'left'}
                  onChange={(align) => patchColumn(id, { align })}
                  options={ALIGN_OPTIONS}
                />
                <PropertySegmentedControl
                  label="Largura"
                  value={width.fixed ? 'fixed' : 'auto'}
                  onChange={(mode) =>
                    patchColumn(id, { width: mode === 'auto' ? undefined : `${width.amount}${width.unit}` })
                  }
                  options={[
                    { value: 'auto', label: 'Automática' },
                    { value: 'fixed', label: 'Fixa' },
                  ]}
                />
                {width.fixed && (
                  <PropertyNumberInput
                    label=""
                    suffix={width.unit}
                    min={1}
                    value={width.amount}
                    onChange={(amount) => patchColumn(id, { width: `${amount}${width.unit}` })}
                  />
                )}
                <PropertyTextInput
                  label="Fórmula (avançado)"
                  value={column.format ?? ''}
                  onChange={(format) => patchColumn(id, { format })}
                  placeholder={token('campo') || '{lista.campo}'}
                  hint="Misture texto e informações, ex.: R$ {lista.valor}."
                  mono
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {columns.length > 0 ? (
        <PropertySortableList
          ids={columns.map((column) => column.id)}
          onCommit={(ids) =>
            onChange(ids.map((id) => columns.find((column) => column.id === id)).filter((c): c is DataTableColumn => Boolean(c)))
          }
          renderItem={renderColumn}
        />
      ) : (
        <PropertyHint className="rounded-lg bg-neutral-50 px-3 py-3 text-center">
          Nenhuma coluna ainda. Adicione abaixo as informações que quer mostrar.
        </PropertyHint>
      )}

      <PropertyCombobox
        label=""
        value=""
        onChange={addColumn}
        options={fieldOptions}
        placeholder="+ Adicionar coluna…"
        searchPlaceholder="Buscar informação…"
        disabled={fieldOptions.length === 0}
      />
    </div>
  );
}
