import React, { useMemo } from 'react';
import { Plus, Trash2, RefreshCw, List, Table2, ListOrdered } from 'lucide-react';
import { createId } from '../../../../../shared/domain/id';
import {
  type BulletListMarker,
  type BulletListProps,
  type DataTableColumn,
  type DataTableProps,
  type NumberedListFormat,
  type NumberedListProps,
  type ReportBand,
  BULLET_LIST_MARKER_LABELS,
  buildColumnsFromDataset,
  getBandDisplayLabel,
  getDefaultBulletList,
  getDefaultDataTable,
  getDefaultNumberedList,
  isBulletListBand,
  isNumberedListBand,
  isTableDataBand,
} from '../../../../band/domain';
import { buildDatasetComboboxGroups, buildDatasetFieldComboboxOptions } from '../controls/comboboxOptions';
import type { DataSourceCatalog } from '../../../../data-source/domain';
import {
  PropertyCheckbox,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertySelect,
  PropertyTextInput,
} from '../controls/PropertyFields';
import { PropertyCombobox } from '../controls/PropertyCombobox';
import { PropertyBorderInput } from '../controls/PropertyBorderInput';

interface DataBandPropertiesSectionProps {
  band: ReportBand;
  bandId: string;
  data: Record<string, unknown[]>;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
}

const NUMBER_FORMAT_OPTIONS: { label: string; value: NumberedListFormat }[] = [
  { label: '1.', value: 'decimal-dot' },
  { label: '1)', value: 'decimal-paren' },
  { label: '1', value: 'decimal' },
];

const BULLET_MARKER_OPTIONS: { label: string; value: BulletListMarker }[] = (
  Object.entries(BULLET_LIST_MARKER_LABELS) as [BulletListMarker, string][]
).map(([value, label]) => ({ label, value }));

export const DataBandPropertiesSection: React.FC<DataBandPropertiesSectionProps> = ({
  band,
  bandId,
  data,
  dataSourceCatalog,
  updateBand,
}) => {
  const dataSource = band.dataSource ?? '';
  const datasetGroups = useMemo(
    () => buildDatasetComboboxGroups(data, dataSourceCatalog, { includeEmpty: true }),
    [data, dataSourceCatalog]
  );
  const datasetFieldOptions = useMemo(
    () => buildDatasetFieldComboboxOptions(dataSource, data),
    [dataSource, data]
  );
  const table: DataTableProps = band.dataTable ?? getDefaultDataTable(dataSource, data);
  const numberedList: NumberedListProps = band.numberedList ?? getDefaultNumberedList();
  const bulletList: BulletListProps = band.bulletList ?? getDefaultBulletList();
  const showTable = isTableDataBand(band);
  const showNumbered = isNumberedListBand(band);
  const showBullet = isBulletListBand(band);
  const bandLabel = getBandDisplayLabel(band.type);

  const patchTable = (patch: Partial<DataTableProps>) => {
    updateBand(bandId, { dataTable: { ...table, ...patch } });
  };

  const patchColumn = (columnId: string, patch: Partial<DataTableColumn>) => {
    patchTable({
      columns: table.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)),
    });
  };

  const patchNumberedList = (patch: Partial<NumberedListProps>) => {
    updateBand(bandId, { numberedList: { ...numberedList, ...patch } });
  };

  const patchBulletList = (patch: Partial<BulletListProps>) => {
    updateBand(bandId, { bulletList: { ...bulletList, ...patch } });
  };

  const syncColumns = () => {
    if (!dataSource) return;
    patchTable({ columns: buildColumnsFromDataset(dataSource, data) });
  };

  const datasetFields =
    dataSource && data[dataSource]?.[0] ? Object.keys(data[dataSource][0] as object) : [];

  const BandTypeIcon = showTable ? Table2 : showNumbered ? ListOrdered : List;

  return (
    <div className="space-y-4 pt-4 border-t border-neutral-100">
      <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
        <BandTypeIcon className="w-3.5 h-3.5" />
        {bandLabel}
      </h4>

      <PropertyHint>
        {showTable
          ? 'Colunas configuráveis ligadas ao dataset — ideal para relatórios tabulares.'
          : showNumbered
            ? 'Cada registro repete a banda com numeração automática à esquerda.'
            : showBullet
              ? 'Cada registro repete a banda com marcador configurável à esquerda.'
              : 'Cada registro repete a banda; posicione textos e campos livremente no canvas.'}
      </PropertyHint>

      <PropertyCombobox
        label="Fonte de dados"
        value={dataSource}
        onChange={(ds) => {
          updateBand(bandId, {
            dataSource: ds,
            ...(showTable && ds ? { dataTable: getDefaultDataTable(ds, data) } : {}),
          });
        }}
        groups={datasetGroups}
        placeholder="Selecione uma fonte…"
        searchPlaceholder="Buscar fonte…"
        hint="Singletons aparecem desabilitados — use em bandas estáticas."
      />

      {showBullet && (
        <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/50 p-3">
          <span className="text-[11px] font-semibold text-neutral-500">Marcadores</span>
          <PropertySelect
            label="Estilo"
            value={bulletList.marker ?? 'none'}
            onChange={(marker) => patchBulletList({ marker })}
            options={BULLET_MARKER_OPTIONS}
          />
          {bulletList.marker !== 'none' && (
            <>
              <PropertyFieldGrid>
                <PropertyNumberInput
                  label="Largura"
                  suffix="px"
                  min={12}
                  value={bulletList.width ?? 20}
                  onChange={(width) => patchBulletList({ width })}
                />
                <PropertyNumberInput
                  label="Tamanho"
                  suffix="px"
                  min={4}
                  max={16}
                  value={bulletList.size ?? 6}
                  onChange={(size) => patchBulletList({ size })}
                />
              </PropertyFieldGrid>
              <PropertyTextInput
                label="Cor"
                value={bulletList.color ?? '#404040'}
                onChange={(color) => patchBulletList({ color })}
                placeholder="#404040"
              />
            </>
          )}
          <PropertyHint>
            O conteúdo da linha começa após a coluna do marcador — sem usar padding no
            canvas.
          </PropertyHint>
        </div>
      )}

      {showNumbered && (
        <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/50 p-3">
          <span className="text-[11px] font-semibold text-neutral-500">Numeração</span>
          <PropertyFieldGrid>
            <PropertyNumberInput
              label="Início"
              min={1}
              value={numberedList.start ?? 1}
              onChange={(start) => patchNumberedList({ start })}
            />
            <PropertyNumberInput
              label="Largura"
              suffix="px"
              min={16}
              value={numberedList.width ?? 28}
              onChange={(width) => patchNumberedList({ width })}
            />
          </PropertyFieldGrid>
          <PropertySelect
            label="Formato"
            value={numberedList.format ?? 'decimal-dot'}
            onChange={(format) => patchNumberedList({ format })}
            options={NUMBER_FORMAT_OPTIONS}
          />
          <PropertyHint>
            Os demais campos da linha são posicionados à direita da numeração.
          </PropertyHint>
        </div>
      )}

      {showTable && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <PropertyCheckbox
              label="Exibir cabeçalho"
              checked={table.showHeader !== false}
              onChange={(showHeader) => patchTable({ showHeader })}
            />
            <button
              type="button"
              onClick={syncColumns}
              disabled={!dataSource}
              className="flex items-center gap-1 text-[10px] font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-40 px-2 py-1 rounded hover:bg-neutral-100"
              title="Gerar colunas a partir dos campos do dataset"
            >
              <RefreshCw className="w-3 h-3" />
              Sincronizar
            </button>
          </div>

          <PropertyBorderInput
            label="Borda da tabela"
            value={table.border ?? '1px solid #e5e5e5'}
            onChange={(border) => patchTable({ border: border || '1px solid #e5e5e5' })}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-neutral-600">Colunas</span>
              <button
                type="button"
                onClick={() =>
                  patchTable({
                    columns: [
                      ...table.columns,
                      {
                        id: createId(),
                        field: datasetFields[0] ?? 'campo',
                        header: 'Nova coluna',
                        align: 'left',
                        format: dataSource
                          ? `{${dataSource}.${datasetFields[0] ?? 'campo'}}`
                          : '',
                      },
                    ],
                  })
                }
                className="flex items-center gap-0.5 text-[10px] font-medium text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100"
              >
                <Plus className="w-3 h-3" />
                Adicionar
              </button>
            </div>

            {table.columns.map((col, index) => (
              <div
                key={col.id}
                className="rounded-md border border-neutral-200 bg-white p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                    Coluna {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      patchTable({ columns: table.columns.filter((c) => c.id !== col.id) })
                    }
                    className="p-1 text-neutral-400 hover:text-red-600 rounded hover:bg-red-50"
                    title="Remover coluna"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {datasetFields.length > 0 ? (
                  <PropertyCombobox
                    label="Campo"
                    value={col.field}
                    onChange={(field) => {
                      patchColumn(col.id, {
                        field,
                        format: dataSource ? `{${dataSource}.${field}}` : col.format,
                      });
                    }}
                    options={datasetFieldOptions}
                    placeholder="Selecione o campo…"
                    searchPlaceholder="Buscar campo…"
                  />
                ) : (
                  <PropertyTextInput
                    label="Campo"
                    value={col.field}
                    onChange={(field) => patchColumn(col.id, { field })}
                  />
                )}

                <PropertyTextInput
                  label="Título"
                  value={col.header}
                  onChange={(header) => patchColumn(col.id, { header })}
                />

                <PropertyFieldGrid>
                  <PropertyTextInput
                    label="Largura"
                    value={col.width ?? ''}
                    onChange={(width) => patchColumn(col.id, { width: width || undefined })}
                    placeholder="auto ou 120px"
                  />
                  <PropertySelect
                    label="Alinhamento"
                    value={col.align ?? 'left'}
                    onChange={(align) =>
                      patchColumn(col.id, { align: align as DataTableColumn['align'] })
                    }
                    options={[
                      { label: 'Esquerda', value: 'left' },
                      { label: 'Centro', value: 'center' },
                      { label: 'Direita', value: 'right' },
                    ]}
                  />
                </PropertyFieldGrid>

                <PropertyTextInput
                  label="Formato / expressão"
                  value={col.format ?? ''}
                  onChange={(format) => patchColumn(col.id, { format })}
                  placeholder={dataSource ? `{${dataSource}.campo}` : '{dataset.campo}'}
                  mono
                />
              </div>
            ))}

            {table.columns.length === 0 && (
              <PropertyHint className="italic">
                Nenhuma coluna. Use &quot;Sincronizar&quot; ou adicione manualmente.
              </PropertyHint>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
