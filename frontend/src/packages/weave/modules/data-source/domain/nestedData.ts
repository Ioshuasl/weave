import type { DataSourceCatalog } from './dataSourceUtils';

/** Campo interno: posição da linha no próprio dataset (a lista aninhada aponta para ela). */
export const NESTED_ROW_FIELD = '__linha';
/** Campo interno da linha filha: posição da linha pai. Ligação da banda de detalhe: `__linha` → `__pai`. */
export const NESTED_PARENT_FIELD = '__pai';

/** Campos que começam com `__` são internos (ligação mestre/detalhe) e não aparecem nas listas de campos. */
export function isHiddenDataField(field: string): boolean {
  return field.startsWith('__');
}

export function getVisibleFieldKeys(row: object): string[] {
  return Object.keys(row).filter((field) => !isHiddenDataField(field));
}

type DataRow = Record<string, unknown>;

function isRowList(value: unknown): value is DataRow[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))
  );
}

export interface FlattenedData {
  data: Record<string, unknown[]>;
  catalog: DataSourceCatalog | undefined;
}

/**
 * Listas dentro do registro (`instrumentos: [{ ..., devedores: [{ nome }] }]`) viram datasets próprios
 * (`devedores`) ligados à linha pai por `__linha` / `__pai`, e o catálogo ganha `parent` para a paleta
 * mostrar "Devedores" dentro do dataset pai. Datasets sem listas aninhadas passam intactos.
 */
export function flattenNestedData(
  data: Record<string, unknown[]> | undefined,
  catalog: DataSourceCatalog | undefined
): FlattenedData | undefined {
  if (!data) return undefined;

  const result: Record<string, unknown[]> = {};
  const nextCatalog: DataSourceCatalog = { ...(catalog ?? {}) };
  let found = false;

  const visit = (key: string, rows: unknown[]) => {
    const children: Record<string, DataRow[]> = {};
    const flatRows = rows.map((row, index) => {
      if (typeof row !== 'object' || row === null) return row;
      const flat: DataRow = { ...(row as DataRow), [NESTED_ROW_FIELD]: index };
      for (const [field, value] of Object.entries(row as DataRow)) {
        if (!isRowList(value) || field in data) continue;
        found = true;
        delete flat[field];
        children[field] ??= [];
        value.forEach((child) => children[field].push({ ...child, [NESTED_PARENT_FIELD]: index }));
      }
      return flat;
    });
    result[key] = flatRows;
    for (const [field, childRows] of Object.entries(children)) {
      const declared = nextCatalog[field];
      nextCatalog[field] = { ...declared, kind: declared?.kind ?? 'list', parent: declared?.parent ?? key };
      visit(field, childRows);
    }
  };

  for (const [key, rows] of Object.entries(data)) visit(key, Array.isArray(rows) ? rows : []);

  return found ? { data: result, catalog: nextCatalog } : { data, catalog };
}
