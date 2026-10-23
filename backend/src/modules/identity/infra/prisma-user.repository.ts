import { prisma } from '../../../shared/infra/prisma'
import type { ProfileUpdate, UserRepository } from '../domain/ports'

export class PrismaUserRepository implements UserRepository {
  findCredentialsByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    })
  }

  async findProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
        mustChangePassword: true,
        username: true,
        jobRole: true,
        timezone: true,
        website: true,
        bio: true,
        avatarFile: true,
        memberships: {
          where: { status: 'ACTIVE' },
          select: { accountId: true, role: true, account: { select: { name: true, type: true, segment: true } } },
        },
      },
    })
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      platformRole: user.platformRole,
      mustChangePassword: user.mustChangePassword,
      username: user.username,
      jobRole: user.jobRole,
      timezone: user.timezone,
      website: user.website,
      bio: user.bio,
      avatarFile: user.avatarFile,
      memberships: user.memberships.map((m) => ({
        accountId: m.accountId,
        accountName: m.account.name,
        accountType: m.account.type,
        accountSegment: m.account.segment,
        role: m.role,
      })),
    }
  }

  async findPasswordHash(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
    return user?.passwordHash ?? null
  }

  findSecurityState(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { mustChangePassword: true, tempPasswordExpiresAt: true } })
  }

  async isUsernameTaken(username: string, exceptUserId: string) {
    return (await prisma.user.count({ where: { username, NOT: { id: exceptUserId } } })) > 0
  }

  async updateProfile(userId: string, data: ProfileUpdate) {
    await prisma.user.update({ where: { id: userId }, data })
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    // trocar a senha encerra o estado de "senha provisória"
    await prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: false, tempPasswordExpiresAt: null } })
  }

  async setAvatarFile(userId: string, file: string | null) {
    const previous = await prisma.user.findUnique({ where: { id: userId }, select: { avatarFile: true } })
    await prisma.user.update({ where: { id: userId }, data: { avatarFile: file } })
    return previous?.avatarFile ?? null
  }
}
