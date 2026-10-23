import type { Prisma } from '@prisma/client'
import { prisma } from '../../../shared/infra/prisma'
import type { MockData, MockDatasetRepository, MockDatasetView } from '../domain/ports'

const select = { id: true, name: true, isDefault: true, data: true, updatedAt: true } as const
const view = (r: { id: string; name: string; isDefault: boolean; data: unknown; updatedAt: Date }): MockDatasetView => ({
  ...r,
  data: r.data as MockData,
})

export class PrismaMockDatasetRepository implements MockDatasetRepository {
  async list(templateId: string) {
    const rows = await prisma.mockDataset.findMany({ where: { templateId }, select, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] })
    return rows.map(view)
  }

  async find(templateId: string, id: string) {
    const row = await prisma.mockDataset.findFirst({ where: { id, templateId }, select })
    return row ? view(row) : null
  }

  create(templateId: string, d: { name: string; data: MockData; isDefault: boolean }) {
    return prisma.$transaction(async (tx) => {
      if (d.isDefault) await tx.mockDataset.updateMany({ where: { templateId }, data: { isDefault: false } })
      return view(await tx.mockDataset.create({ data: { templateId, name: d.name, data: d.data as Prisma.InputJsonValue, isDefault: d.isDefault }, select }))
    })
  }

  update(id: string, d: { name?: string; data?: MockData; isDefault?: boolean }) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.mockDataset.findUniqueOrThrow({ where: { id }, select: { templateId: true } })
      if (d.isDefault) await tx.mockDataset.updateMany({ where: { templateId: current.templateId }, data: { isDefault: false } })
      return view(await tx.mockDataset.update({ where: { id }, data: { name: d.name, data: d.data as Prisma.InputJsonValue | undefined, isDefault: d.isDefault }, select }))
    })
  }

  async remove(id: string) {
    await prisma.mockDataset.delete({ where: { id } })
  }

  async copyAll(fromTemplateId: string, toTemplateId: string) {
    const rows = await prisma.mockDataset.findMany({ where: { templateId: fromTemplateId } })
    if (rows.length === 0) return
    await prisma.mockDataset.createMany({
      data: rows.map((r) => ({ templateId: toTemplateId, name: r.name, data: r.data as Prisma.InputJsonValue, isDefault: r.isDefault })),
    })
  }
}
