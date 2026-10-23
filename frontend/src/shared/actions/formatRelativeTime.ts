const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const pad = (n: number) => String(n).padStart(2, '0')

/** "21/10/2026 às 12:31" no fuso informado (padrão: o do navegador). */
export const formatDateTime = (value: string | Date, timeZone?: string) => {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone,
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')}/${get('month')}/${get('year')} às ${pad(Number(get('hour')))}:${get('minute')}`
}

/**
 * Tempo decorrido, pensado para vir depois de "Atualizado ":
 * "agora" · "há 12 min" · "há 2h" (até 24h) · depois "em 21/10/2026 às 12:31".
 */
export const formatRelativeTime = (value: string | Date, now: number = Date.now(), timeZone?: string) => {
  const elapsed = now - new Date(value).getTime()
  if (elapsed < MINUTE) return 'agora' // inclui relógios levemente adiantados
  if (elapsed < HOUR) return `há ${Math.floor(elapsed / MINUTE)} min`
  if (elapsed < DAY) return `há ${Math.floor(elapsed / HOUR)}h`
  return `em ${formatDateTime(value, timeZone)}`
}
