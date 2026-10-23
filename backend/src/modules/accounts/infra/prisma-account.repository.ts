import { prisma } from '../../../shared/infra/prisma'
import type { AccountRepository, RegistrationData } from '../domain/ports'

const select = { id: true, type: true, name: true, document: true } as const

export class PrismaAccountRepository implements AccountRepository {
  async emailExists(email: string) {
    return (await prisma.user.count({ where: { email } })) > 0
  }

  async createWithOwner(data: RegistrationData) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: data.name, email: data.email, passwordHash: data.passwordHash },
      })
      const account = await tx.account.create({
        data: { type: data.accountType, name: data.accountName, document: data.document, segment: data.segment },
      })
      await tx.membership.create({ data: { accountId: account.id, userId: user.id, role: 'OWNER' } })
      return { userId: user.id, accountId: account.id }
    })
  }

  findById(accountId: string) {
    return prisma.account.findUnique({ where: { id: accountId }, select })
  }

  update(accountId: string, data: { name?: string; document?: string | null }) {
    return prisma.account.update({ where: { id: accountId }, data, select })
  }

  async findActiveRole(accountId: string, userId: string) {
    const m = await prisma.membership.findUnique({
      where: { accountId_userId: { accountId, userId } },
      select: { role: true, status: true },
    })
    return m && m.status === 'ACTIVE' ? m.role : null
  }

  async isSupport(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { platformRole: true } })
    return user?.platformRole === 'SUPPORT'
  }
}
