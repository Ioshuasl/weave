import { type DataSourceCatalog, getDataSourceKind, getDataSourceLabel, resolveDatasetField } from '../../data-source/domain';
import { resolveSystemVariable, type SystemVariables } from './systemVariables';

export interface DataFieldOption {
  label: string;
  value: string;
  dataset: string;
  kind: 'singleton' | 'list';
}

export function buildDataFieldOptions(
  data: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): DataFieldOption[] {
  return buildGroupedDataFieldOptions(data, catalog).all;
}

export function buildGroupedDataFieldOptions(
  data: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): {
  singletons: DataFieldOption[];
  lists: DataFieldOption[];
  all: DataFieldOption[];
} {
  const singletons: DataFieldOption[] = [];
  const lists: DataFieldOption[] = [];

  for (const [dataset, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const first = rows[0];
    if (typeof first !== 'object' || first === null) continue;

    const kind = getDataSourceKind(dataset, data, catalog);
    const datasetLabel = getDataSourceLabel(dataset, catalog);

    for (const field of Object.keys(first)) {
      const option: DataFieldOption = {
        label: `${datasetLabel}.${field}`,
        value: `{${dataset}.${field}}`,
        dataset,
        kind,
      };
      if (kind === 'singleton') {
        singletons.push(option);
      } else {
        lists.push(option);
      }
    }
  }

  return {
    singletons,
    lists,
    all: [...singletons, ...lists],
  };
}

export interface EvaluateExpressionContext {
  row?: Record<string, unknown>;
  sys?: Partial<SystemVariables>;
  data?: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
}

function normalizeExpressionContext(
  context?: Record<string, unknown> | EvaluateExpressionContext
): EvaluateExpressionContext {
  if (!context) return {};
  if ('row' in context || 'sys' in context || 'data' in context || 'dataSourceCatalog' in context) {
    return context as EvaluateExpressionContext;
  }
  return { row: context as Record<string, unknown> };
}

export const evaluateExpression = (
  expression: string,
  context?: Record<string, unknown> | EvaluateExpressionContext
): string => {
  if (!expression) return '';

  const { row, sys, data, dataSourceCatalog } = normalizeExpressionContext(context);

  return expression.replace(/\{([^}]+)\}/g, (match, key) => {
    const sysValue = resolveSystemVariable(key, sys);
    if (sysValue !== undefined) return sysValue;

    const parts = key.split('.');
    if (parts.length === 2 && data) {
      const [dataset, field] = parts;
      const datasetValue = resolveDatasetField(
        dataset,
        field,
        data,
        row,
        dataSourceCatalog
      );
      if (datasetValue !== undefined) return datasetValue;
    }

    if (parts.length === 2) {
      const [, field] = parts;
      if (row && row[field] !== undefined && row[field] !== null) {
        return String(row[field]);
      }
    }

    return match;
  });
};
