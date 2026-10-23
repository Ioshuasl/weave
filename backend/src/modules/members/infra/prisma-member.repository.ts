import type { MemberRole } from '@prisma/client'
import { prisma } from '../../../shared/infra/prisma'
import type { MemberRepository, MemberView } from '../domain/ports'

export const memberSelect = {
  id: true,
  role: true,
  status: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, mustChangePassword: true, tempPasswordExpiresAt: true, managedByAccountId: true } },
} as const

type Row = {
  id: string
  role: MemberRole
  status: MemberView['status']
  createdAt: Date
  user: { id: string; name: string; email: string; mustChangePassword: boolean; tempPasswordExpiresAt: Date | null; managedByAccountId: string | null }
}

export const toMemberView = (m: Row, accountId: string): MemberView => ({
  membershipId: m.id,
  userId: m.user.id,
  name: m.user.name,
  email: m.user.email,
  role: m.role,
  status: m.status,
  createdAt: m.createdAt,
  managed: m.user.managedByAccountId === accountId,
  mustChangePassword: m.user.mustChangePassword,
  tempPasswordExpiresAt: m.user.tempPasswordExpiresAt,
})

export class PrismaMemberRepository implements MemberRepository {
  async list(accountId: string) {
    const rows = await prisma.membership.findMany({ where: { accountId }, select: memberSelect, orderBy: { createdAt: 'asc' } })
    return rows.map((r) => toMemberView(r, accountId))
  }

  async find(accountId: string, membershipId: string) {
    const row = await prisma.membership.findFirst({ where: { id: membershipId, accountId }, select: memberSelect })
    return row ? toMemberView(row, accountId) : null
  }

  async updateRole(membershipId: string, role: MemberRole) {
    await prisma.membership.update({ where: { id: membershipId }, data: { role } })
  }

  async remove(membershipId: string) {
    await prisma.membership.delete({ where: { id: membershipId } })
  }

  async isMember(accountId: string, email: string) {
    return (await prisma.membership.count({ where: { accountId, user: { email } } })) > 0
  }

  getAccount(accountId: string) {
    return prisma.account.findUnique({ where: { id: accountId }, select: { name: true, type: true } })
  }
}
