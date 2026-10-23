export type TempPasswordStatus = 'ACTIVE' | 'EXPIRED' | null

/** Estado da senha provisória de um membro: aguardando o 1º acesso, vencida, ou nenhuma (já trocou). */
export const getTempPasswordStatus = (member: { mustChangePassword: boolean; tempPasswordExpiresAt: string | null }): TempPasswordStatus => {
  if (!member.mustChangePassword) return null
  if (member.tempPasswordExpiresAt && new Date(member.tempPasswordExpiresAt) < new Date()) return 'EXPIRED'
  return 'ACTIVE'
}
