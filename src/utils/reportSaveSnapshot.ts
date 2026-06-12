import type { ReportDefinition } from '../types/report';

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

/** Presets de intervalo para `autoSaveIntervalMs` no ReportDesigner */
export const REPORT_AUTO_SAVE_INTERVAL_MS = {
  OFF: 0,
  SEC_10: 10_000,
  SEC_20: 20_000,
  SEC_30: 30_000,
  MIN_1: 60_000,
  MIN_5: 300_000,
} as const;

export type ReportAutoSaveIntervalMs =
  | (typeof REPORT_AUTO_SAVE_INTERVAL_MS)[keyof typeof REPORT_AUTO_SAVE_INTERVAL_MS]
  | number;

export function formatAutoSaveInterval(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const minutes = ms / 60_000;
  return minutes === 1 ? '1 min' : `${minutes} min`;
}
