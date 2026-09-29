/**
 * Debug de performance do designer (estilo, drag, resize, renders).
 * Ativar: ?debugStyle=1 na URL ou localStorage.setItem('debugStyle', '1')
 */
const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

const isEnabled = (): boolean => {
  if (!isDev) return false;
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem('debugStyle') === '0') return false;
  } catch {
    /* ignore */
  }
  if (new URLSearchParams(window.location.search).has('debugStyle')) return true;
  // Em dev, ativo por padrão até localStorage.debugStyle = '0'
  return true;
};

let enabled = isEnabled();

const renderCounts = new Map<string, number>();
const actionCounts = new Map<string, number>();

export const stylePreviewDebug = {
  isEnabled: () => enabled,

  enable() {
    enabled = true;
    try {
      localStorage.setItem('debugStyle', '1');
    } catch {
      /* ignore */
    }
    console.info('[style-debug] Ativado. Recarregue a página e interaja com o canvas.');
  },

  disable() {
    enabled = false;
    try {
      localStorage.removeItem('debugStyle');
    } catch {
      /* ignore */
    }
  },

  /** Zera contadores entre testes (ex.: antes de arrastar uma banda). */
  reset() {
    renderCounts.clear();
    actionCounts.clear();
    console.info('[style-debug] Contadores zerados.');
  },

  log(...args: unknown[]) {
    if (!enabled) return;
    console.log('[style-debug]', ...args);
  },

  time(label: string) {
    if (!enabled) return;
    console.time(`[style-debug] ${label}`);
  },

  timeEnd(label: string) {
    if (!enabled) return;
    console.timeEnd(`[style-debug] ${label}`);
  },

  countRender(component: string) {
    if (!enabled) return;
    const n = (renderCounts.get(component) ?? 0) + 1;
    renderCounts.set(component, n);
    if (n <= 5 || n % 20 === 0) {
      console.log(`[style-debug] render #${n}: ${component}`);
    }
    if (n === 500) {
      console.error(`[style-debug] ⚠ possível loop: ${component} renderizou 500×`);
    }
  },

  countAction(action: string, detail?: unknown) {
    if (!enabled) return;
    const n = (actionCounts.get(action) ?? 0) + 1;
    actionCounts.set(action, n);
    if (n <= 5 || n % 20 === 0) {
      console.log(`[style-debug] action #${n}: ${action}`, detail ?? '');
    }
    if (n === 500) {
      console.error(`[style-debug] ⚠ possível loop: ${action} chamado 500×`);
    }
  },

  dumpSummary() {
    if (!enabled) return;
    console.table(
      [...renderCounts.entries()].map(([name, count]) => ({ tipo: 'render', name, count }))
    );
    console.table(
      [...actionCounts.entries()].map(([name, count]) => ({ tipo: 'action', name, count }))
    );
  },
};

if (enabled && typeof window !== 'undefined') {
  (window as unknown as { stylePreviewDebug: typeof stylePreviewDebug }).stylePreviewDebug =
    stylePreviewDebug;
  console.info(
    '[style-debug] Ativo. stylePreviewDebug.reset() → teste → dumpSummary(). Desativar: disable()'
  );
}
