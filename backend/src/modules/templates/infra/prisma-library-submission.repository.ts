import type { Prisma, SubmissionStatus } from '@prisma/client'
import { prisma } from '../../../shared/infra/prisma'
import type { MockData, ReportDocument } from '../domain/ports'
import type { LibrarySubmissionRepository, NewSubmission, SubmissionSnapshot, SubmissionView } from '../domain/sharing-ports'
import { toPerson } from './prisma-template.repository'

const viewSelect = {
  id: true,
  templateId: true,
  status: true,
  name: true,
  description: true,
  segment: true,
  note: true,
  versionNumber: true,
  reviewNote: true,
  publishedTemplateId: true,
  accountId: true,
  createdAt: true,
  reviewedAt: true,
  template: { select: { name: true } },
  submittedBy: { select: { name: true, avatarFile: true } },
} as const

type Row = Prisma.LibrarySubmissionGetPayload<{ select: typeof viewSelect }>

const accountNames = async (ids: string[]) => {
  const rows = await prisma.account.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, name: true } })
  return new Map(rows.map((a) => [a.id, a.name]))
}

const toView = (row: Row, names: Map<string, string>): SubmissionView => ({
  id: row.id,
  templateId: row.templateId,
  templateName: row.template.name,
  status: row.status,
  name: row.name,
  description: row.description,
  segment: row.segment,
  note: row.note,
  versionNumber: row.versionNumber,
  reviewNote: row.reviewNote,
  publishedTemplateId: row.publishedTemplateId,
  accountName: names.get(row.accountId) ?? null,
  submittedBy: toPerson(row.submittedBy)!,
  createdAt: row.createdAt,
  reviewedAt: row.reviewedAt,
})

const viewOf = async (row: Row) => toView(row, await accountNames([row.accountId]))

export class PrismaLibrarySubmissionRepository implements LibrarySubmissionRepository {
  async create(d: NewSubmission) {
    const row = await prisma.librarySubmission.create({
      data: {
        templateId: d.templateId,
        accountId: d.accountId,
        submittedById: d.submittedById,
        name: d.name,
        description: d.description,
        segment: d.segment,
        note: d.note,
        versionNumber: d.versionNumber,
        document: d.document as Prisma.InputJsonValue,
        mockDatasetName: d.mockDatasetName,
        mockData: (d.mockData ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      select: viewSelect,
    })
    return viewOf(row)
  }

  async findLatestForTemplate(templateId: string) {
    const row = await prisma.librarySubmission.findFirst({ where: { templateId }, orderBy: { createdAt: 'desc' }, select: viewSelect })
    return row ? viewOf(row) : null
  }

  async findPendingForTemplate(templateId: string) {
    const row = await prisma.librarySubmission.findFirst({ where: { templateId, status: 'PENDING' }, select: viewSelect })
    return row ? viewOf(row) : null
  }

  async findById(id: string): Promise<SubmissionSnapshot | null> {
    const row = await prisma.librarySubmission.findUnique({ where: { id }, select: { ...viewSelect, submittedById: true, document: true, mockDatasetName: true, mockData: true } })
    if (!row) return null
    const { submittedById, document, mockDatasetName, mockData, ...view } = row
    return { ...(await viewOf(view)), submittedById, document: document as ReportDocument, mockDatasetName, mockData: (mockData as MockData | null) ?? null }
  }

  async list(status?: SubmissionStatus) {
    const rows = await prisma.librarySubmission.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: status === 'PENDING' ? 'asc' : 'desc' },
      select: viewSelect,
      take: 200,
    })
    const names = await accountNames(rows.map((r) => r.accountId))
    return rows.map((r) => toView(r, names))
  }

  async remove(id: string) {
    await prisma.librarySubmission.delete({ where: { id } })
  }

  async markApproved(id: string, reviewerId: string, publishedTemplateId: string) {
    await prisma.librarySubmission.update({ where: { id }, data: { status: 'APPROVED', reviewedById: reviewerId, reviewedAt: new Date(), publishedTemplateId } })
  }

  async markRejected(id: string, reviewerId: string, reviewNote: string) {
    await prisma.librarySubmission.update({ where: { id }, data: { status: 'REJECTED', reviewedById: reviewerId, reviewedAt: new Date(), reviewNote } })
  }
}
