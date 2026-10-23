import { prisma } from '../../../shared/infra/prisma'
import type { SessionRepository } from '../domain/ports'

export class PrismaSessionRepository implements SessionRepository {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ip?: string }) {
    await prisma.refreshToken.create({ data })
  }

  findByTokenHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    })
  }

  async revoke(id: string) {
    await prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } })
  }

  async revokeAllForUser(userId: string) {
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
  }

  listActive(userId: string) {
    return prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, tokenHash: true, userAgent: true, ip: true, createdAt: true },
    })
  }

  async revokeOwned(userId: string, sessionId: string) {
    const result = await prisma.refreshToken.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } })
    return result.count > 0
  }
}
