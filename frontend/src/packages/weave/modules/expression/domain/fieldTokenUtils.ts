import {
  type DataSourceCatalog,
  getDataFieldLabel,
  getDataSourceKind,
  getDataSourceLabel,
  getSingletonRow,
} from '../../data-source/domain';
import { describeCalculoToken } from './calculos';
import { DESIGN_MODE_SYSTEM_VARIABLES, resolveSystemVariable, type SystemVariables } from './systemVariables';

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
  const calculo = describeCalculoToken(token.slice(1, -1));
  if (calculo) return calculo;
  const inner = token.slice(1, -1);
  const dot = inner.indexOf('.');
  if (dot < 0 || !data) return inner;
  const dataset = inner.slice(0, dot);
  if (dataset === 'sys' || dataset === 'page') return inner;
  return getDataFieldLabel(dataset, inner.slice(dot + 1), catalog);
}

export function getFieldChipTitle(
  token: string,
  data?: Record<string, unknown[]>,
  catalog?: DataSourceCatalog
): string {
  const preview = resolveFieldTokenPreview(token, data, catalog);
  const label = getFieldTokenLabel(token, catalog);
  return preview ? `${label} — ex.: ${preview}` : label;
}

/** Nome amigável do campo: `{protocolos.apres}` → `Protocolos · Apresentante` */
export function getFieldTokenLabel(token: string, catalog?: DataSourceCatalog): string {
  const inner = token.slice(1, -1);
  const dot = inner.indexOf('.');
  if (dot < 0) return inner;
  const dataset = inner.slice(0, dot);
  if (dataset === 'sys' || dataset === 'page') return inner;
  return `${getDataSourceLabel(dataset, catalog)} · ${getDataFieldLabel(dataset, inner.slice(dot + 1), catalog)}`;
}

export type FieldTokenStatus =
  | { kind: 'value'; text: string }
  | { kind: 'empty' }
  | { kind: 'missing' }
  | { kind: 'unknown' };

/**
 * Situação de um campo na pré-visualização do canvas (primeira linha do conjunto): valor, vazio,
 * inexistente nos dados (aviso ao usuário) ou desconhecido (ex.: `{page.*}` sem host).
 */
export function resolveFieldTokenStatus(
  token: string,
  context: {
    data: Record<string, unknown[]>;
    sys?: Partial<SystemVariables>;
  }
): FieldTokenStatus {
  const key = token.slice(1, -1);
  const sysValue = resolveSystemVariable(key, context.sys);
  if (sysValue !== undefined) return { kind: 'value', text: sysValue };

  const dot = key.indexOf('.');
  if (dot < 0) return { kind: 'unknown' };
  const dataset = key.slice(0, dot);
  if (dataset === 'sys' || dataset === 'page') return { kind: 'unknown' };

  const rows = context.data[dataset];
  const first = Array.isArray(rows) ? rows[0] : undefined;
  const row = typeof first === 'object' && first !== null ? (first as Record<string, unknown>) : undefined;
  const field = key.slice(dot + 1);
  if (!row || !(field in row)) return { kind: 'missing' };

  const value = row[field];
  if (value === undefined || value === null || value === '') return { kind: 'empty' };
  return {
    kind: 'value',
    text: typeof value === 'object' ? JSON.stringify(value) : String(value as string | number | boolean),
  };
}
