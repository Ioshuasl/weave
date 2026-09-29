import type { HistoryEntry } from './designerHistory';

/** Entradas do timeline ainda não enviadas ao host (exclui `init` de bootstrap) */
export function getHistoryEntriesToPersist(
  past: HistoryEntry[],
  persistedIds: ReadonlySet<string>
): HistoryEntry[] {
  return past.filter(
    (entry) => !persistedIds.has(entry.id) && entry.kind !== 'init'
  );
}
