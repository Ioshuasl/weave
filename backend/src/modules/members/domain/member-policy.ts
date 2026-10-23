import type { MemberRole } from '@prisma/client'
import { forbidden } from '../../../shared/errors/app-error'

/** OWNER nunca é alterado/removido aqui; só OWNER mexe em ADMIN ou concede ADMIN. */
export const assertCanManageMember = (actor: MemberRole, target: MemberRole, newRole?: MemberRole) => {
  if (target === 'OWNER') throw forbidden('O proprietário da conta não pode ser alterado')
  if (target === 'ADMIN' && actor !== 'OWNER') throw forbidden('Apenas o proprietário gerencia administradores')
  if (newRole === 'ADMIN' && actor !== 'OWNER') throw forbidden('Apenas o proprietário concede o papel de administrador')
}
