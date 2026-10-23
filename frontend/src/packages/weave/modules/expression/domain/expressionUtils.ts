import {
  type DataSourceCatalog,
  getDataFieldLabel,
  getDataSourceKind,
  getDataSourceLabel,
  resolveDatasetField,
} from '../../data-source/domain';
import { evaluateCalcExpression, isCalcExpression } from './expressionCalc';
import { FormulaError, evaluateFormula, formatFormulaResult } from './formulaPt';
import { resolveSystemVariable, type SystemVariables } from './systemVariables';
import { resolveIndexedNestedField } from './nestedListText';

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

    for (const field of Object.keys(first).filter((name) => !name.startsWith('__'))) {
      const option: DataFieldOption = {
        label: `${datasetLabel} · ${getDataFieldLabel(dataset, field, catalog)}`,
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

export const evaluateExpression = (
  expression: string,
  context: EvaluateExpressionContext = {}
): string => {
  if (!expression) return '';

  const { row, sys, data, dataSourceCatalog } = context;

  return expression.replace(/\{([^}]+)\}/g, (match: string, key: string) => {
    const sysValue = resolveSystemVariable(key, sys);
    if (sysValue !== undefined) return sysValue;

    if (key.trimStart().startsWith('=')) {
      try {
        return formatFormulaResult(
          evaluateFormula(key.trimStart().slice(1), { row, data, dataSourceCatalog })
        );
      } catch (error) {
        if (!(error instanceof FormulaError)) return '⚠ Erro no cálculo';
        return `⚠ ${error.message}${error.suggestion ? ` ${error.suggestion}` : ''}`;
      }
    }

    if (isCalcExpression(key)) {
      const calculated = evaluateCalcExpression(key, { row, data, dataSourceCatalog });
      if (calculated !== undefined) return calculated;
    }

    const indexed = resolveIndexedNestedField(key, { row, data });
    if (indexed !== undefined) return indexed;

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
