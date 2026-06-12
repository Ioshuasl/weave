import type { ReportData, ReportDefinition } from '../types/report';
import { normalizeReportDefinition } from './reportMigration';

export const REPORT_FILE_VERSION = 1;

export interface ReportExportPayload {
  version: number;
  exportedAt: string;
  report: ReportDefinition;
  data?: ReportData;
}

export class ReportImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportImportError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isReportDefinition(value: unknown): value is ReportDefinition {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false;
  if (!Array.isArray(value.pages) || value.pages.length === 0) return false;
  if (!isRecord(value.bands) || !isRecord(value.components)) return false;

  const page = value.pages[0];
  if (!isRecord(page) || !Array.isArray(page.bands)) return false;

  for (const bandId of page.bands) {
    if (typeof bandId !== 'string' || !value.bands[bandId]) return false;
  }

  const dividers = page.dividers;
  if (dividers !== undefined) {
    if (!Array.isArray(dividers)) return false;
    for (const bandId of dividers) {
      if (typeof bandId !== 'string' || !value.bands[bandId]) return false;
    }
  }

  for (const comp of Object.values(value.components)) {
    if (!isRecord(comp) || typeof comp.parentId !== 'string') return false;
    if (!value.bands[comp.parentId as string]) return false;
  }

  return true;
}

export function buildReportExportPayload(
  report: ReportDefinition,
  data?: ReportData,
  includeData = true
): ReportExportPayload {
  return {
    version: REPORT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    report,
    ...(includeData && data ? { data } : {}),
  };
}

export function parseReportImportFile(raw: string): {
  report: ReportDefinition;
  data?: ReportData;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ReportImportError('Arquivo JSON inválido.');
  }

  if (!isRecord(parsed)) {
    throw new ReportImportError('O arquivo deve conter um objeto JSON.');
  }

  let reportSource: unknown;
  let dataSource: unknown;

  if (isReportDefinition(parsed)) {
    reportSource = parsed;
  } else if (isReportDefinition(parsed.report)) {
    reportSource = parsed.report;
    dataSource = parsed.data;
  } else {
    throw new ReportImportError(
      'Formato não reconhecido. Use um ReportDefinition ou um pacote { report, data? }.'
    );
  }

  const report = normalizeReportDefinition(reportSource as ReportDefinition);

  if (dataSource !== undefined) {
    if (!isRecord(dataSource)) {
      throw new ReportImportError('O campo "data" deve ser um objeto com datasets.');
    }
    for (const rows of Object.values(dataSource)) {
      if (!Array.isArray(rows)) {
        throw new ReportImportError('Cada dataset em "data" deve ser um array.');
      }
    }
    return { report, data: dataSource as ReportData };
  }

  return { report };
}

export function downloadReportJson(
  report: ReportDefinition,
  data?: ReportData,
  filename?: string
) {
  const payload = buildReportExportPayload(report, data, true);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = (filename || report.name || 'relatorio')
    .replace(/[^\w\-]+/g, '_')
    .slice(0, 80);
  anchor.href = url;
  anchor.download = `${safeName}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function pickReportJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function readReportJsonFile(file: File): Promise<string> {
  return file.text();
}
