import { prisma } from '../../../shared/infra/prisma'
import type { InvitationRepository } from '../domain/ports'

const viewSelect = { id: true, email: true, role: true, expiresAt: true, createdAt: true } as const

export class PrismaInvitationRepository implements InvitationRepository {
  create(data: Parameters<InvitationRepository['create']>[0]) {
    return prisma.invitation.create({ data, select: viewSelect })
  }

  listPending(accountId: string) {
    return prisma.invitation.findMany({
      where: { accountId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      select: viewSelect,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByTokenHash(tokenHash: string) {
    const row = await prisma.invitation.findUnique({
      where: { tokenHash },
      select: { ...viewSelect, accountId: true, acceptedAt: true, revokedAt: true, account: { select: { name: true } } },
    })
    if (!row) return null
    const { account, ...rest } = row
    return { ...rest, accountName: account.name }
  }

  async revoke(accountId: string, invitationId: string) {
    const result = await prisma.invitation.updateMany({
      where: { id: invitationId, accountId, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return result.count > 0
  }

  async accept(data: { invitationId: string; accountId: string; userId: string; role: Parameters<InvitationRepository['accept']>[0]['role'] }) {
    await prisma.$transaction([
      prisma.membership.create({ data: { accountId: data.accountId, userId: data.userId, role: data.role } }),
      prisma.invitation.update({ where: { id: data.invitationId }, data: { acceptedAt: new Date() } }),
    ])
  }
}
