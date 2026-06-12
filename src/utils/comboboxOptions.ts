import type { DataSourceCatalog } from './dataSourceUtils';
import {
  getDataSourceKind,
  getDataSourceLabel,
  partitionDataSources,
} from './dataSourceUtils';
import type { ComboboxGroup } from '../components/designer/properties/PropertyCombobox';

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
      options: lists.map((key) => ({
        label: getDataSourceLabel(key, catalog),
        value: key,
      })),
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
  data: Record<string, unknown[]>
): { label: string; value: string }[] {
  const rows = data[datasetKey];
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const first = rows[0];
  if (typeof first !== 'object' || first === null) return [];
  return Object.keys(first as object).map((field) => ({
    label: field,
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
