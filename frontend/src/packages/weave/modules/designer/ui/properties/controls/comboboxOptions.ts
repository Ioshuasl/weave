import {
  type DataSourceCatalog,
  getDataFieldLabel,
  getDataSourceKind,
  getDataSourceLabel,
  partitionDataSources,
} from '../../../../data-source/domain';
import type { ComboboxGroup } from './PropertyCombobox';

export function buildDatasetComboboxGroups(
  data: Record<string, unknown[]>,
  catalog?: DataSourceCatalog,
  options?: { listsOnly?: boolean; includeEmpty?: boolean }
): ComboboxGroup[] {
  const { singletons, lists } = partitionDataSources(data, catalog);
  const groups: ComboboxGroup[] = [];

  if (!options?.listsOnly && singletons.length > 0) {
    groups.push({
      label: 'Configuração (não repetível)',
      options: singletons.map((key) => ({
        label: getDataSourceLabel(key, catalog),
        value: key,
        disabled: true,
        description: 'Use em bandas estáticas ou textos fixos',
      })),
    });
  }

  if (lists.length > 0) {
    groups.push({
      label: 'Listas',
      options: lists.map((key) => {
        const parent = catalog?.[key]?.parent;
        return {
          label: getDataSourceLabel(key, catalog),
          value: key,
          description: parent ? `Dentro de ${getDataSourceLabel(parent, catalog)}` : undefined,
        };
      }),
    });
  }

  if (options?.includeEmpty) {
    return [
      {
        label: 'Fontes',
        options: [{ label: 'Nenhuma', value: '' }],
      },
      ...groups,
    ];
  }

  return groups;
}

export function buildDatasetFieldComboboxOptions(
  datasetKey: string,
  data: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): { label: string; value: string }[] {
  const rows = data[datasetKey];
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const first = rows[0];
  if (typeof first !== 'object' || first === null) return [];
  return Object.keys(first).filter((field) => !field.startsWith('__')).map((field) => ({
    label: getDataFieldLabel(datasetKey, field, catalog),
    value: field,
  }));
}

export function getListDatasetKeys(
  data: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): string[] {
  return Object.keys(data).filter(
    (key) => getDataSourceKind(key, data, catalog) === 'list'
  );
}
