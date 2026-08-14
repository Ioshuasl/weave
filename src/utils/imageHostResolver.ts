/**
 * O host converte URLs autenticadas / bloqueadas por CORS em blob: ou data:
 * que o <img> consegue exibir. Não é chamado para data: ou blob: já resolvidos.
 */
export type ReportImageResolver = (
  url: string
) => string | null | undefined | Promise<string | null | undefined>;

const resolvedCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function shouldSkipResolver(src: string): boolean {
  const value = src.trim().toLowerCase();
  return !value || value.startsWith('data:') || value.startsWith('blob:');
}

export function resolveImageUrlWithHost(
  src: string,
  resolver?: ReportImageResolver | null
): Promise<string> {
  const trimmed = src.trim();
  if (!trimmed || !resolver || shouldSkipResolver(trimmed)) {
    return Promise.resolve(trimmed);
  }

  const cached = resolvedCache.get(trimmed);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(trimmed);
  if (pending) return pending;

  const task = Promise.resolve()
    .then(() => resolver(trimmed))
    .then((next) => {
      const out = typeof next === 'string' && next.trim() ? next.trim() : trimmed;
      resolvedCache.set(trimmed, out);
      inflight.delete(trimmed);
      return out;
    })
    .catch(() => {
      inflight.delete(trimmed);
      return trimmed;
    });

  inflight.set(trimmed, task);
  return task;
}
