/** Rótulo do dia para agrupar linhas do tempo: "Hoje", "Ontem" ou "20 de outubro de 2026" (no fuso informado). */
export const formatDayLabel = (value: string | Date, now: number = Date.now(), timeZone?: string) => {
  const key = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(d) // yyyy-mm-dd
  const date = new Date(value)
  const today = key(new Date(now))
  const yesterday = key(new Date(now - 24 * 60 * 60 * 1000))
  const day = key(date)
  if (day === today) return 'Hoje'
  if (day === yesterday) return 'Ontem'
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone }).format(date)
}

/** Chave estável (yyyy-mm-dd) do dia, para agrupar. */
export const dayKey = (value: string | Date, timeZone?: string) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(value))
