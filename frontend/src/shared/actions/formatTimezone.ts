const FALLBACK = ['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza', 'America/Noronha', 'America/Rio_Branco', 'UTC']

export const listTimezones = (): string[] => {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  return intl.supportedValuesOf?.('timeZone') ?? FALLBACK
}

/** "(GMT-03:00) America/Sao_Paulo" */
export const formatTimezone = (timeZone: string) => {
  try {
    const part = new Intl.DateTimeFormat('pt-BR', { timeZone, timeZoneName: 'longOffset' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')
    const offset = part?.value === 'GMT' ? 'GMT+00:00' : (part?.value ?? '')
    return `(${offset}) ${timeZone.replace(/_/g, ' ')}`
  } catch {
    return timeZone
  }
}
