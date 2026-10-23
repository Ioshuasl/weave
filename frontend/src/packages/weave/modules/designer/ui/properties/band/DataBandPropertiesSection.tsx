import { List, ListOrdered, RefreshCw, Table2 } from 'lucide-react';
import React, { useMemo } from 'react';
import {
  type BulletListMarker,
  type BulletListProps,
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
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { buildDatasetComboboxGroups, buildDatasetFieldComboboxOptions } from '../controls/comboboxOptions';
import { PropertyBorderInput } from '../controls/PropertyBorderInput';
import { PropertyCombobox } from '../controls/PropertyCombobox';
import {
  PropertyCheckbox,
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
  PropertySelect,
} from '../controls/PropertyFields';
import { BandLinkPropertiesSection } from './BandLinkPropertiesSection';
import { TableColumnsEditor } from './TableColumnsEditor';
import type { DataSourceCatalog } from '../../../../data-source/domain';

interface DataBandPropertiesSectionProps {
  band: ReportBand;
  bandId: string;
  reportId: string;
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
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

const INTRO: Record<'table' | 'numbered' | 'bullet' | 'list', string> = {
  table: 'Mostra os registros em colunas, com um título em cada uma.',
  numbered: 'Mostra uma linha para cada registro, numerada automaticamente.',
  bullet: 'Mostra uma linha para cada registro, com um marcador ao lado.',
  list: 'Repete esta linha para cada registro. Arraste os textos e campos dentro dela.',
};

export const DataBandPropertiesSection: React.FC<DataBandPropertiesSectionProps> = ({
  band,
  bandId,
  reportId,
  data,
  dataSourceCatalog,
  updateBand,
}) => {
  const dataSource = band.dataSource ?? '';
  const datasetGroups = useMemo(
    () => buildDatasetComboboxGroups(data, dataSourceCatalog, { listsOnly: true, includeEmpty: true }),
    [data, dataSourceCatalog]
  );
  const fieldOptions = useMemo(
    () => buildDatasetFieldComboboxOptions(dataSource, data, dataSourceCatalog),
    [dataSource, data, dataSourceCatalog]
  );
  const table: DataTableProps = band.dataTable ?? getDefaultDataTable(dataSource, data);
  const numberedList: NumberedListProps = band.numberedList ?? getDefaultNumberedList();
  const bulletList: BulletListProps = band.bulletList ?? getDefaultBulletList();
  const showTable = isTableDataBand(band);
  const showNumbered = isNumberedListBand(band);
  const showBullet = isBulletListBand(band);
  const kind = showTable ? 'table' : showNumbered ? 'numbered' : showBullet ? 'bullet' : 'list';
  const KindIcon = showTable ? Table2 : showNumbered ? ListOrdered : List;

  const patchTable = (patch: Partial<DataTableProps>) => updateBand(bandId, { dataTable: { ...table, ...patch } });
  const patchNumberedList = (patch: Partial<NumberedListProps>) =>
    updateBand(bandId, { numberedList: { ...numberedList, ...patch } });
  const patchBulletList = (patch: Partial<BulletListProps>) =>
    updateBand(bandId, { bulletList: { ...bulletList, ...patch } });

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5 rounded-lg bg-indigo-50/70 px-3 py-2.5">
        <KindIcon className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-indigo-950">{getBandDisplayLabel(band.type)}</p>
          <p className="text-[12px] leading-snug text-indigo-900/80">{INTRO[kind]}</p>
        </div>
      </div>

      <PropertyCombobox
        label="Uma linha para cada…"
        value={dataSource}
        onChange={(ds) =>
          updateBand(bandId, {
            dataSource: ds,
            ...(showTable && ds ? { dataTable: getDefaultDataTable(ds, data) } : {}),
          })
        }
        groups={datasetGroups}
        placeholder="Escolha uma lista…"
        searchPlaceholder="Buscar lista…"
      />

      {showTable && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-semibold text-neutral-800">Colunas</h4>
            <button
              type="button"
              onClick={() => dataSource && patchTable({ columns: buildColumnsFromDataset(dataSource, data) })}
              disabled={!dataSource}
              title="Refaz as colunas com todas as informações da lista (as atuais serão substituídas)"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 disabled:pointer-events-none disabled:opacity-40"
            >
              <RefreshCw className="size-3" />
              Usar todas
            </button>
          </div>
          <TableColumnsEditor
            columns={table.columns}
            dataSource={dataSource}
            fieldOptions={fieldOptions}
            onChange={(columns) => patchTable({ columns })}
          />
          <PropertyCheckbox
            label="Mostrar títulos das colunas"
            checked={table.showHeader !== false}
            onChange={(showHeader) => patchTable({ showHeader })}
          />
        </section>
      )}

      {showNumbered && (
        <section className="space-y-3">
          <h4 className="text-[13px] font-semibold text-neutral-800">Numeração</h4>
          <PropertySegmentedControl
            label="Estilo do número"
            value={numberedList.format ?? 'decimal-dot'}
            onChange={(format) => patchNumberedList({ format })}
            options={NUMBER_FORMAT_OPTIONS}
          />
          <PropertyNumberInput
            label="Começar em"
            min={1}
            value={numberedList.start ?? 1}
            onChange={(start) => patchNumberedList({ start })}
          />
        </section>
      )}

      {showBullet && (
        <section className="space-y-3">
          <h4 className="text-[13px] font-semibold text-neutral-800">Marcador</h4>
          <PropertySelect
            label="Estilo"
            value={bulletList.marker ?? 'none'}
            onChange={(marker) => patchBulletList({ marker })}
            options={BULLET_MARKER_OPTIONS}
          />
          {bulletList.marker !== 'none' && (
            <PropertyColorInput
              label="Cor"
              value={bulletList.color ?? '#404040'}
              onChange={(color) => patchBulletList({ color })}
            />
          )}
        </section>
      )}

      {!showTable && (
        <BandLinkPropertiesSection band={band} bandId={bandId} reportId={reportId} data={data} updateBand={updateBand} />
      )}

      {(showNumbered || showBullet || showTable) && (
        <PropertyAccordion title="Avançado" sectionId={`list-advanced-${kind}`} reportId={reportId} defaultOpen={false}>
          {showTable && (
            <PropertyBorderInput
              label="Borda da tabela"
              value={table.border ?? '1px solid #e5e5e5'}
              onChange={(border) => patchTable({ border: border || '1px solid #e5e5e5' })}
            />
          )}
          {showNumbered && (
            <PropertyNumberInput
              label="Espaço reservado ao número"
              suffix="px"
              min={16}
              value={numberedList.width ?? 28}
              onChange={(width) => patchNumberedList({ width })}
              hint="Os demais campos da linha ficam à direita da numeração."
            />
          )}
          {showBullet && bulletList.marker !== 'none' && (
            <PropertyFieldGrid>
              <PropertyNumberInput
                label="Espaço do marcador"
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
          )}
          {!showTable && <PropertyHint>O conteúdo da linha começa depois do número ou marcador.</PropertyHint>}
        </PropertyAccordion>
      )}
    </div>
  );
};
