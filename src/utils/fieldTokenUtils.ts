import type { DataSourceCatalog } from './dataSourceUtils';
import { getDataSourceKind, getSingletonRow } from './dataSourceUtils';
import { DESIGN_MODE_SYSTEM_VARIABLES } from './systemVariables';

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

function truncatePreview(text: string, max = 36): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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

export function resolveFieldTokenPreview(
  token: string,
  data?: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): string | undefined {
  if (!token.startsWith('{') || !token.endsWith('}')) return undefined;

  const sys = systemPreview(token);
  if (sys) return sys;

  if (!data) return undefined;

  const dataset = datasetFromToken(token);
  const field = fieldFromToken(token);
  const kind = getDataSourceKind(dataset, data, catalog);

  if (kind === 'singleton') {
    const row = getSingletonRow(data, dataset);
    const value = row?.[field];
    if (value !== undefined && value !== null) {
      return truncatePreview(String(value));
    }
  }

  const rows = data[dataset];
  if (Array.isArray(rows) && rows.length > 0) {
    const first = rows[0];
    if (typeof first === 'object' && first !== null) {
      const value = (first as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) {
        return truncatePreview(String(value));
      }
    }
  }

  return undefined;
}

export function getFieldChipDisplayLabel(
  token: string,
  data?: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): string {
  const preview = resolveFieldTokenPreview(token, data, catalog);
  if (preview) return preview;
  return token.slice(1, -1);
}

export function getFieldChipTitle(
  token: string,
  data?: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): string {
  const preview = resolveFieldTokenPreview(token, data, catalog);
  return preview ? `${token} — ${preview}` : token;
}
