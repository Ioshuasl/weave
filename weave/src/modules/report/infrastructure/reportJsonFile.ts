import type { ReportData } from '../../data-source/domain';
import type { ReportDefinition } from '../domain/report';
import { buildReportExportPayload } from '../domain/reportSerialization';

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
