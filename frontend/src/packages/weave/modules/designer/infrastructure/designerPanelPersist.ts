import type { DesignerPanelState } from '../domain/designerPanelState';

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = 'fastreport-designer-panels:';

export interface DesignerPanelPersistState {
  version: typeof STORAGE_VERSION;
  leftOpen: boolean;
  rightOpen: boolean;
}

export function getDesignerPanelStorageKey(reportId: string): string {
  return `${STORAGE_PREFIX}${reportId}`;
}

export function loadDesignerPanelState(
  reportId: string
): DesignerPanelState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(getDesignerPanelStorageKey(reportId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DesignerPanelPersistState>;
    if (parsed.version !== STORAGE_VERSION) return null;
    if (typeof parsed.leftOpen !== 'boolean' || typeof parsed.rightOpen !== 'boolean') {
      return null;
    }

    return { leftOpen: parsed.leftOpen, rightOpen: parsed.rightOpen };
  } catch {
    return null;
  }
}

export function saveDesignerPanelState(
  reportId: string,
  state: DesignerPanelState
): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: DesignerPanelPersistState = {
      version: STORAGE_VERSION,
      leftOpen: state.leftOpen,
      rightOpen: state.rightOpen,
    };
    localStorage.setItem(getDesignerPanelStorageKey(reportId), JSON.stringify(payload));
  } catch {
    // quota / private mode — ignorar
  }
}
