import type { ReportDefinition } from './report';

export function createReportSaveSnapshot(
  report: ReportDefinition,
  data: Record<string, unknown[]>
): string {
  return JSON.stringify({ report, data });
}

export function isReportStateDirty(
  report: ReportDefinition,
  data: Record<string, unknown[]>,
  lastSavedSnapshot: string | null
): boolean {
  if (lastSavedSnapshot === null) return false;
  return createReportSaveSnapshot(report, data) !== lastSavedSnapshot;
}
