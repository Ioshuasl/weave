import type { DataSourceCatalog } from './dataSourceUtils';
import { getSingletonRow } from './dataSourceUtils';
import { buildGroupedDataFieldOptions } from './reportUtils';
import {
  DESIGN_MODE_SYSTEM_VARIABLES,
  SYSTEM_DATE_TIME_FIELD_OPTIONS,
  SYSTEM_VARIABLE_FIELD_OPTIONS,
} from './systemVariables';

export interface ExpressionSuggestion {
  token: string;
  label: string;
  preview?: string;
}

export interface ExpressionSuggestionGroup {
  id: string;
  label: string;
  items: ExpressionSuggestion[];
}

function fieldFromToken(token: string): string {
  const inner = token.slice(1, -1);
  const dot = inner.indexOf('.');
  return dot >= 0 ? inner.slice(dot + 1) : inner;
}

function datasetFromToken(token: string): string {
  const inner = token.slice(1, -1);
  const dot = inner.indexOf('.');
  return dot >= 0 ? inner.slice(0, dot) : inner;
}

function singletonPreview(
  token: string,
  data: Record<string, unknown[]>
): string | undefined {
  const dataset = datasetFromToken(token);
  const field = fieldFromToken(token);
  const row = getSingletonRow(data, dataset);
  const value = row?.[field];
  if (value === undefined || value === null) return undefined;
  const text = String(value);
  return text.length > 36 ? `${text.slice(0, 33)}…` : text;
}

function systemPreview(token: string): string | undefined {
  const key = token.slice(1, -1);
  const map: Record<string, string | number | undefined> = {
    'sys.pageNumber': DESIGN_MODE_SYSTEM_VARIABLES.pageNumber,
    'sys.pageCount': DESIGN_MODE_SYSTEM_VARIABLES.pageCount,
    'Page#': DESIGN_MODE_SYSTEM_VARIABLES.pageNumber,
    'TotalPages#': DESIGN_MODE_SYSTEM_VARIABLES.pageCount,
    'sys.reportName': DESIGN_MODE_SYSTEM_VARIABLES.reportName,
    'sys.date': DESIGN_MODE_SYSTEM_VARIABLES.date,
    'sys.dateLong': DESIGN_MODE_SYSTEM_VARIABLES.dateLong,
    'sys.time': DESIGN_MODE_SYSTEM_VARIABLES.time,
    'sys.timeLong': DESIGN_MODE_SYSTEM_VARIABLES.timeLong,
  };
  const value = map[key];
  return value !== undefined ? String(value) : undefined;
}

export function buildExpressionFieldSuggestions(
  data: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): ExpressionSuggestionGroup[] {
  const grouped = buildGroupedDataFieldOptions(data, catalog);
  const groups: ExpressionSuggestionGroup[] = [];

  if (grouped.singletons.length > 0) {
    groups.push({
      id: 'config',
      label: 'Configuração',
      items: grouped.singletons.map((opt) => ({
        token: opt.value,
        label: opt.label,
        preview: singletonPreview(opt.value, data),
      })),
    });
  }

  if (grouped.lists.length > 0) {
    groups.push({
      id: 'lists',
      label: 'Listas',
      items: grouped.lists.map((opt) => ({
        token: opt.value,
        label: opt.label,
        preview: singletonPreview(opt.value, data),
      })),
    });
  }

  const dateTimeItems = SYSTEM_DATE_TIME_FIELD_OPTIONS.map((opt) => ({
    token: opt.value,
    label: opt.label,
    preview: systemPreview(opt.value),
  }));
  if (dateTimeItems.length > 0) {
    groups.push({ id: 'datetime', label: 'Data e hora', items: dateTimeItems });
  }

  const systemItems = SYSTEM_VARIABLE_FIELD_OPTIONS.filter(
    (opt) => !SYSTEM_DATE_TIME_FIELD_OPTIONS.some((dt) => dt.value === opt.value)
  ).map((opt) => ({
    token: opt.value,
    label: opt.label,
    preview: systemPreview(opt.value),
  }));
  if (systemItems.length > 0) {
    groups.push({ id: 'system', label: 'Sistema', items: systemItems });
  }

  return groups;
}

export function filterExpressionSuggestions(
  groups: ExpressionSuggestionGroup[],
  query: string
): ExpressionSuggestionGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.token.toLowerCase().includes(q) ||
          item.label.toLowerCase().includes(q) ||
          item.token.slice(1, -1).toLowerCase().includes(q)
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function flattenExpressionSuggestions(
  groups: ExpressionSuggestionGroup[]
): ExpressionSuggestion[] {
  return groups.flatMap((group) => group.items);
}
