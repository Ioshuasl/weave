import type { HistoryEntry } from './designerHistory';
import { REPORT_AUTO_SAVE_INTERVAL_MS } from './reportSaveSnapshot';

/** Presets de intervalo para `historyPersistIntervalMs` (mesmos valores do auto-save) */
export const REPORT_HISTORY_PERSIST_INTERVAL_MS = REPORT_AUTO_SAVE_INTERVAL_MS;

export type ReportHistoryPersistIntervalMs =
  | (typeof REPORT_HISTORY_PERSIST_INTERVAL_MS)[keyof typeof REPORT_HISTORY_PERSIST_INTERVAL_MS]
  | number;

/** Entradas do timeline ainda não enviadas ao host (exclui `init` de bootstrap) */
export function getHistoryEntriesToPersist(
  past: HistoryEntry[],
  persistedIds: ReadonlySet<string>
): HistoryEntry[] {
  return past.filter(
    (entry) => !persistedIds.has(entry.id) && entry.kind !== 'init'
  );
}
