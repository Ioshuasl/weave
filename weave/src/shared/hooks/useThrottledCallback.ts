import { useCallback, useEffect, useRef } from 'react';

/**
 * Limita chamadas (ex.: updates no store) sem perder o valor final.
 * `flush()` aplica o último argumento pendente imediatamente.
 */
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  intervalMs: number
) {
  const callbackRef = useRef(callback);
  const lastRunRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  callbackRef.current = callback;

  const cancel = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingArgsRef.current) {
      callbackRef.current(...pendingArgsRef.current);
      pendingArgsRef.current = null;
      lastRunRef.current = Date.now();
    }
  }, []);

  const throttled = useCallback((...args: Parameters<T>) => {
    pendingArgsRef.current = args;
    const now = Date.now();
    const elapsed = now - lastRunRef.current;

    if (elapsed >= intervalMs) {
      lastRunRef.current = now;
      pendingArgsRef.current = null;
      callbackRef.current(...args);
      return;
    }

    if (timerRef.current == null) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (pendingArgsRef.current) {
          callbackRef.current(...pendingArgsRef.current);
          pendingArgsRef.current = null;
          lastRunRef.current = Date.now();
        }
      }, intervalMs - elapsed);
    }
  }, [intervalMs]);

  useEffect(() => () => flush(), [flush]);

  return { throttled, flush, cancel };
}
