/** Presets de intervalo para `autoSaveIntervalMs` no Weave */
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

/** Presets de intervalo para `historyPersistIntervalMs` (mesmos valores do auto-save) */
export const REPORT_HISTORY_PERSIST_INTERVAL_MS = REPORT_AUTO_SAVE_INTERVAL_MS;

export type ReportHistoryPersistIntervalMs =
  | (typeof REPORT_HISTORY_PERSIST_INTERVAL_MS)[keyof typeof REPORT_HISTORY_PERSIST_INTERVAL_MS]
  | number;
