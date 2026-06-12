export type DataSourceKind = 'singleton' | 'list';

export interface DataSourceDefinition {
  kind: DataSourceKind;
  label?: string;
}

export type DataSourceCatalog = Record<string, DataSourceDefinition>;

export function inferDataSourceKind(rows: unknown[] | undefined): DataSourceKind {
  if (!Array.isArray(rows) || rows.length <= 1) return 'singleton';
  return 'list';
}

export function getDataSourceKind(
  datasetKey: string,
  data: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): DataSourceKind {
  const explicit = catalog?.[datasetKey]?.kind;
  if (explicit) return explicit;
  return inferDataSourceKind(data[datasetKey]);
}

export function getDataSourceLabel(
  datasetKey: string,
  catalog?: DataSourceCatalog
): string {
  return catalog?.[datasetKey]?.label ?? datasetKey;
}

export function getSingletonRow(
  data: Record<string, unknown[]>,
  datasetKey: string
): Record<string, unknown> | undefined {
  const rows = data[datasetKey];
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const first = rows[0];
  if (typeof first !== 'object' || first === null) return undefined;
  return first as Record<string, unknown>;
}

export function resolveDatasetField(
  datasetKey: string,
  field: string,
  data: Record<string, unknown[]>,
  row?: Record<string, unknown>,
  catalog?: DataSourceCatalog
): string | undefined {
  const kind = getDataSourceKind(datasetKey, data, catalog);

  if (kind === 'singleton') {
    const singleton = getSingletonRow(data, datasetKey);
    const value = singleton?.[field];
    if (value !== undefined && value !== null) return String(value);
    return undefined;
  }

  if (row && row[field] !== undefined && row[field] !== null) {
    return String(row[field]);
  }

  const rows = data[datasetKey];
  if (Array.isArray(rows) && rows.length > 0) {
    const first = rows[0];
    if (typeof first === 'object' && first !== null) {
      const value = (first as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) return String(value);
    }
  }

  return undefined;
}

export function partitionDataSources(
  data: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): { singletons: string[]; lists: string[] } {
  const singletons: string[] = [];
  const lists: string[] = [];

  for (const key of Object.keys(data)) {
    if (getDataSourceKind(key, data, catalog) === 'singleton') {
      singletons.push(key);
    } else {
      lists.push(key);
    }
  }

  singletons.sort();
  lists.sort();

  return { singletons, lists };
}
