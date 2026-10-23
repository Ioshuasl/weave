import { prisma } from '../../../shared/infra/prisma'
import type { TagRepository } from '../domain/ports'

const select = { id: true, name: true, color: true, accountId: true } as const
const view = ({ accountId, ...tag }: { id: string; name: string; color: import('@prisma/client').TagColor; accountId: string | null }) => ({
  ...tag,
  system: accountId === null,
})

export class PrismaTagRepository implements TagRepository {
  async listVisible(accountId: string) {
    const rows = await prisma.tag.findMany({ where: { OR: [{ accountId }, { accountId: null }] }, select, orderBy: { name: 'asc' } })
    return rows.map(view)
  }

  async find(tagId: string) {
    const row = await prisma.tag.findUnique({ where: { id: tagId }, select })
    return row ? { ...view(row), accountId: row.accountId } : null
  }

  async findByName(accountId: string | null, name: string) {
    const row = await prisma.tag.findFirst({ where: { accountId, name: { equals: name, mode: 'insensitive' } }, select })
    return row ? view(row) : null
  }

  async create(data: { accountId: string | null; name: string; color: import('@prisma/client').TagColor }) {
    return view(await prisma.tag.create({ data, select }))
  }

  async update(tagId: string, data: { name?: string; color?: import('@prisma/client').TagColor }) {
    return view(await prisma.tag.update({ where: { id: tagId }, data, select }))
  }

  async delete(tagId: string) {
    await prisma.tag.delete({ where: { id: tagId } })
  }
}
