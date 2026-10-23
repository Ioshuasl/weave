import { prisma } from '../../../shared/infra/prisma'
import type { ManagedMemberRepository } from '../domain/ports'
import { memberSelect, toMemberView } from './prisma-member.repository'

export class PrismaManagedMemberRepository implements ManagedMemberRepository {
  createManaged(data: Parameters<ManagedMemberRepository['createManaged']>[0]) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          mustChangePassword: true,
          tempPasswordExpiresAt: data.expiresAt,
          managedByAccountId: data.accountId,
        },
        select: { id: true },
      })
      const membership = await tx.membership.create({
        data: { accountId: data.accountId, userId: user.id, role: data.role },
        select: memberSelect,
      })
      return toMemberView(membership, data.accountId)
    })
  }

  async resetManagedPassword(data: { accountId: string; userId: string; passwordHash: string; expiresAt: Date }) {
    return prisma.$transaction(async (tx) => {
      // só quem foi cadastrado por ESTA conta (nunca a conta pessoal/outra empresa de alguém)
      const updated = await tx.user.updateMany({
        where: { id: data.userId, managedByAccountId: data.accountId },
        data: { passwordHash: data.passwordHash, mustChangePassword: true, tempPasswordExpiresAt: data.expiresAt },
      })
      if (updated.count === 0) return false
      await tx.refreshToken.updateMany({ where: { userId: data.userId, revokedAt: null }, data: { revokedAt: new Date() } })
      return true
    })
  }

  async emailExists(email: string) {
    return (await prisma.user.count({ where: { email } })) > 0
  }
}
