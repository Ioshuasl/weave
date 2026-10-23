export const MemberRoleEnum = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const
export type MemberRoleEnum = (typeof MemberRoleEnum)[keyof typeof MemberRoleEnum]

export const MemberRoleLabel: Record<MemberRoleEnum, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Visualizador',
}

export const MemberRoleHint: Record<MemberRoleEnum, string> = {
  OWNER: 'Controle total da conta',
  ADMIN: 'Gerencia equipe e relatórios',
  EDITOR: 'Cria e edita relatórios',
  VIEWER: 'Somente visualiza e pré-visualiza',
}
