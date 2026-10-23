import { NESTED_PARENT_FIELD, NESTED_ROW_FIELD, type DataSourceCatalog } from '../../data-source/domain';

type DataRow = Record<string, unknown>;

const NESTED_TOKEN = /\{([A-Za-z_]\w*)\.(\w+)\}/g;
const INDEXED_TOKEN = /^\s*([A-Za-z_]\w*)\[(\d+)\]\.(\w+)\s*$/;

interface NestedContext {
  row?: DataRow;
  data?: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
}

/** Linhas da lista aninhada que pertencem à linha atual (`__pai` = `__linha` do registro). */
export function getNestedChildRows(
  dataset: string,
  data: Record<string, unknown[]> | undefined,
  row: DataRow | undefined
): DataRow[] {
  const rows = data?.[dataset];
  if (!Array.isArray(rows) || !row || row[NESTED_ROW_FIELD] === undefined) return [];
  return rows.filter(
    (item): item is DataRow =>
      typeof item === 'object' && item !== null && (item as DataRow)[NESTED_PARENT_FIELD] === row[NESTED_ROW_FIELD]
  );
}

/** Resolve `{lista[2].campo}` (token gerado pela expansão) na linha atual. */
export function resolveIndexedNestedField(key: string, ctx: NestedContext): string | undefined {
  const match = INDEXED_TOKEN.exec(key);
  if (!match || !ctx.data) return undefined;
  const [, dataset, index, field] = match;
  const value = getNestedChildRows(dataset, ctx.data, ctx.row)[Number(index)]?.[field];
  return value === undefined || value === null ? '' : String(value);
}

/**
 * Texto com campos de uma lista aninhada (ex.: `{devedores.nome}\n{devedores.endereco}`) repete o texto inteiro
 * uma vez por item da lista da linha atual, separados por quebra de linha. Lista vazia = texto vazio.
 * Só vale para listas vindas de dentro do registro (`__pai`); os demais textos passam intactos.
 */
export function expandNestedListContent(content: string, ctx: NestedContext): string {
  const { row, data, dataSourceCatalog } = ctx;
  if (!content || !data || !row || row[NESTED_ROW_FIELD] === undefined) return content;

  const child = [...content.matchAll(NESTED_TOKEN)]
    .map((match) => match[1])
    .find(
      (dataset) =>
        dataSourceCatalog?.[dataset]?.parent !== undefined &&
        Array.isArray(data[dataset]) &&
        data[dataset].some((item) => typeof item === 'object' && item !== null && NESTED_PARENT_FIELD in item)
    );
  if (!child) return content;

  const count = getNestedChildRows(child, data, row).length;
  return Array.from({ length: count }, (_, index) =>
    content.replace(NESTED_TOKEN, (token, dataset: string, field: string) =>
      dataset === child ? `{${dataset}[${index}].${field}}` : token
    )
  ).join('\n');
}
