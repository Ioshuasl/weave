import { prisma } from '../../../shared/infra/prisma'
import type { UserDirectory } from '../domain/ports'

export class PrismaUserDirectory implements UserDirectory {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, select: { id: true } })
  }

  async findEmailById(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    return user?.email ?? null
  }

  async create(data: { name: string; email: string; passwordHash: string }) {
    const user = await prisma.user.create({ data, select: { id: true } })
    return user.id
  }
}
