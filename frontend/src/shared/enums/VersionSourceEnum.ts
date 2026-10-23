export type VersionSourceEnum = 'MANUAL' | 'ASSISTANT' | 'RESTORE'

export const VersionSourceLabel: Record<VersionSourceEnum, string> = {
  MANUAL: 'Edição manual',
  ASSISTANT: 'Assistente de IA',
  RESTORE: 'Restauração',
}
