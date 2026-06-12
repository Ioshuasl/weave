const STORAGE_KEY = 'properties-panel.recent-fields';
const MAX_RECENT = 5;

function storageKey(reportId?: string): string {
  return reportId ? `${STORAGE_KEY}.${reportId}` : STORAGE_KEY;
}

export function readRecentFieldTokens(reportId?: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(reportId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecentFieldToken(token: string, reportId?: string): void {
  if (!token) return;
  const current = readRecentFieldTokens(reportId).filter((item) => item !== token);
  const next = [token, ...current].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(storageKey(reportId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
