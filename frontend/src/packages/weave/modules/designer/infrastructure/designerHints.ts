const STORAGE_KEY = 'designer.hint-seen';

function storageKey(hintId: string): string {
  return `${STORAGE_KEY}.${hintId}`;
}

/** Dicas de primeiro uso — somem depois que o usuário executa a ação ensinada */
export function hasSeenDesignerHint(hintId: string): boolean {
  try {
    return localStorage.getItem(storageKey(hintId)) === 'true';
  } catch {
    return true;
  }
}

export function markDesignerHintSeen(hintId: string): void {
  try {
    localStorage.setItem(storageKey(hintId), 'true');
  } catch {
    /* ignore */
  }
}
