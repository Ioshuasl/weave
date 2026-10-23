import { Layers, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../shared/ui/cn';
import { DESIGNER_MODAL_OVERLAY_Z } from '../../../../shared/ui/zIndex';
import {
  getDataFieldLabel,
  getDataSourceLabel,
  partitionDataSources,
} from '../../../data-source/domain';
import { useDataSourceCatalog } from '../../../data-source/ui';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import {
  getRowFields,
  suggestItemColumns,
  suggestLinkField,
  suggestTitleField,
} from '../../domain/groupedList';
import {
  PropertyCheckbox,
  PropertyHint,
  PropertySelect,
} from '../properties/controls/PropertyFields';

interface Selection {
  group: string;
  item: string;
  groupField: string;
  itemField: string;
  titleField: string;
  columns: string[];
}

/** Assistente "Lista agrupada": monta grupos (ex.: dias) com itens (ex.: protocolos) já ligados. */
export function GroupedListDialog({ onClose }: { onClose: () => void }) {
  const data = useDesignerStore((state) => state.data as Record<string, unknown[]>);
  const addGroupedList = useDesignerStore((state) => state.addGroupedList);
  const catalog = useDataSourceCatalog();

  const handleEscapeKey = useCallback(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => handleEscapeKey(), [handleEscapeKey]);
  const { lists } = partitionDataSources(data, catalog);

  const fieldsOf = (dataset: string) => getRowFields(data[dataset]);
  const fieldLabel = (dataset: string, field: string) => getDataFieldLabel(dataset, field, catalog);
  const datasetLabel = (dataset: string) => getDataSourceLabel(dataset, catalog);

  const suggest = (group: string, item: string): Selection => {
    const link = suggestLinkField(fieldsOf(group), fieldsOf(item));
    return {
      group,
      item,
      groupField: link,
      itemField: link,
      titleField: suggestTitleField(fieldsOf(group), link),
      columns: suggestItemColumns(fieldsOf(item), link),
    };
  };

  const [selection, setSelection] = useState<Selection>(() => {
    const group = lists[0] ?? '';
    const item =
      lists.find(
        (other) => other !== group && suggestLinkField(fieldsOf(group), fieldsOf(other)),
      ) ??
      lists.find((other) => other !== group) ??
      '';
    return suggest(group, item);
  });

  const { group, item, groupField, itemField, titleField, columns } = selection;
  const groupFields = fieldsOf(group);
  const itemFields = fieldsOf(item);
  const canCreate = Boolean(
    group && item && group !== item && groupField && itemField && columns.length > 0,
  );

  const handleCreate = () => {
    if (!canCreate) return;
    addGroupedList({
      groupDataSource: group,
      itemDataSource: item,
      groupField,
      itemField,
      titleField,
      itemFields: columns,
      groupLabel: datasetLabel(group),
      itemLabel: datasetLabel(item),
      fieldLabels: Object.fromEntries(itemFields.map((field) => [field, fieldLabel(item, field)])),
    });
    onClose();
  };

  const listOptions = (exclude?: string) =>
    lists
      .filter((dataset) => dataset !== exclude)
      .map((dataset) => ({ label: datasetLabel(dataset), value: dataset }));

  return createPortal(
    <div
      data-weave-overlay
      data-weave-theme
      className="fixed inset-0 flex items-center justify-center bg-neutral-900/30 p-4 backdrop-blur-sm"
      style={{ zIndex: DESIGNER_MODAL_OVERLAY_Z }}
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="grouped-list-title"
        className="bg-weave-surface flex max-h-[min(88vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-neutral-200/80 shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 bg-neutral-50 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 ring-1 ring-neutral-900/5">
              <Layers className="h-4 w-4 text-neutral-700" />
            </div>
            <div className="min-w-0">
              <h2 id="grouped-list-title" className="text-[15px] font-semibold text-neutral-800">
                Lista agrupada
              </h2>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                Ex.: protocolos agrupados por dia, cada dia com seus protocolos embaixo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {lists.length < 2 ? (
          <div className="p-4">
            <PropertyHint>
              É preciso ter pelo menos duas listas nos dados (uma para os grupos e outra para os
              itens).
            </PropertyHint>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <Step number={1} title="Agrupar por qual lista?">
              <PropertySelect
                label="Lista dos grupos"
                value={group}
                onChange={(next) =>
                  setSelection(
                    suggest(next, item === next ? (listOptions(next)[0]?.value ?? '') : item),
                  )
                }
                options={listOptions()}
              />
            </Step>

            <Step number={2} title="O que mostrar dentro de cada grupo?">
              <PropertySelect
                label="Lista dos itens"
                value={item}
                onChange={(next) => setSelection(suggest(group, next))}
                options={listOptions(group)}
              />
              <div>
                <span className="mb-1 block text-[12px] font-medium text-neutral-700">
                  Colunas de cada item
                </span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {itemFields.map((field) => (
                    <PropertyCheckbox
                      key={field}
                      label={fieldLabel(item, field)}
                      checked={columns.includes(field)}
                      onChange={(checked) =>
                        setSelection({
                          ...selection,
                          columns: checked
                            ? itemFields.filter((f) => f === field || columns.includes(f))
                            : columns.filter((f) => f !== field),
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </Step>

            <Step number={3} title="Como saber a qual grupo cada item pertence?">
              <div className="grid grid-cols-2 gap-3">
                <PropertySelect
                  label={`Campo em ${datasetLabel(group)}`}
                  value={groupField}
                  onChange={(next) => setSelection({ ...selection, groupField: next })}
                  options={[
                    { label: 'Escolha…', value: '' },
                    ...groupFields.map((field) => ({
                      label: fieldLabel(group, field),
                      value: field,
                    })),
                  ]}
                />
                <PropertySelect
                  label={`é igual a, em ${datasetLabel(item)}`}
                  value={itemField}
                  onChange={(next) => setSelection({ ...selection, itemField: next })}
                  options={[
                    { label: 'Escolha…', value: '' },
                    ...itemFields.map((field) => ({
                      label: fieldLabel(item, field),
                      value: field,
                    })),
                  ]}
                />
              </div>
              {!groupField && (
                <PropertyHint>
                  Não encontramos um campo em comum. Escolha os campos que ligam as duas listas.
                </PropertyHint>
              )}
              <PropertySelect
                label="Título de cada grupo"
                value={titleField}
                onChange={(next) => setSelection({ ...selection, titleField: next })}
                options={[
                  { label: 'Sem título', value: '' },
                  ...groupFields.map((field) => ({
                    label: fieldLabel(group, field),
                    value: field,
                  })),
                ]}
              />
            </Step>

            {canCreate && (
              <p className="rounded-md bg-indigo-50 px-3 py-2 text-[12px] leading-relaxed text-indigo-900">
                Para cada <strong>{datasetLabel(group)}</strong>
                {titleField && (
                  <>
                    {' '}
                    (título: <strong>{fieldLabel(group, titleField)}</strong>)
                  </>
                )}
                , mostra <strong>{datasetLabel(item)}</strong> quando{' '}
                <strong>{fieldLabel(item, itemField)}</strong> for igual a{' '}
                <strong>{fieldLabel(group, groupField)}</strong>.
              </p>
            )}
          </div>
        )}

        <div className="flex shrink-0 justify-end gap-2 border-t border-neutral-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-weave-surface rounded-md border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className={cn(
              'rounded-md bg-indigo-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-indigo-700',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            Criar lista agrupada
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold text-neutral-800">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] text-white">
          {number}
        </span>
        {title}
      </h3>
      <div className="space-y-3 pl-7">{children}</div>
    </section>
  );
}
