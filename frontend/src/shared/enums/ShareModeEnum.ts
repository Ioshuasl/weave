export const ShareModeEnum = { OFF: 'OFF', PUBLIC: 'PUBLIC', MEMBERS: 'MEMBERS' } as const
export type ShareModeEnum = (typeof ShareModeEnum)[keyof typeof ShareModeEnum]

export const ShareModeLabel: Record<ShareModeEnum, string> = {
  OFF: 'Não compartilhado',
  PUBLIC: 'Qualquer pessoa com o link',
  MEMBERS: 'Só quem tem conta no Weave',
}

export const ShareModeHint: Record<ShareModeEnum, string> = {
  OFF: 'Só a sua conta enxerga este modelo.',
  PUBLIC: 'Quem abrir o link vê o modelo com os dados de exemplo, sem precisar entrar.',
  MEMBERS: 'Quem abrir o link precisa entrar (ou criar uma conta gratuita) para ver o modelo.',
}
