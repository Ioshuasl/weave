import type { Prisma } from '@prisma/client'
import { prisma } from '../../../shared/infra/prisma'
import type {
  CreateTemplateData,
  ReportDocument,
  PersonView,
  TemplateDetail,
  TemplateFilters,
  TemplateTagView,
  TemplateRepository,
  UpdateTemplateData,
} from '../domain/ports'

const tagsSelect = {
  select: { tag: { select: { id: true, name: true, color: true, accountId: true } } },
  orderBy: { tag: { name: 'asc' } },
} as const

export const summarySelect = {
  id: true,
  name: true,
  description: true,
  tags: tagsSelect,
  previewFile: true,
  originId: true,
  isSystem: true,
  currentVersion: true,
  updatedAt: true,
  createdBy: { select: { name: true, avatarFile: true } },
} as const

type TagRow = { tag: { id: string; name: string; color: TemplateTagView['color']; accountId: string | null } }
const mapTags = (rows: TagRow[]): TemplateTagView[] => rows.map(({ tag }) => ({ id: tag.id, name: tag.name, color: tag.color, system: tag.accountId === null }))
export const toPerson = (user: { name: string; avatarFile: string | null } | null): PersonView | null =>
  user ? { name: user.name, avatarUrl: user.avatarFile ? `/avatars/${user.avatarFile}` : null } : null
export const toSummary = <T extends { tags: TagRow[]; previewFile: string | null; createdBy: { name: string; avatarFile: string | null } | null }>({ previewFile, createdBy, ...row }: T) => ({
  ...row,
  tags: mapTags(row.tags),
  createdBy: toPerson(createdBy),
  previewUrl: previewFile ? `/previews/${previewFile}` : null,
})

const asJson = (doc: ReportDocument) => doc as Prisma.InputJsonValue

export class PrismaTemplateRepository implements TemplateRepository {
  async list(accountId: string, filters: TemplateFilters) {
    const rows = await prisma.reportTemplate.findMany({
      where: {
        archivedAt: null,
        OR: [{ accountId }, { isSystem: true }],
        ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
        ...(filters.search ? { name: { contains: filters.search, mode: 'insensitive' } } : {}),
      },
      select: summarySelect,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }, { updatedAt: 'desc' }],
    })
    return rows.map(toSummary)
  }

  async findVisible(accountId: string, templateId: string): Promise<TemplateDetail | null> {
    const t = await prisma.reportTemplate.findFirst({
      where: { id: templateId, archivedAt: null, OR: [{ accountId }, { isSystem: true }] },
      select: { ...summarySelect, versions: { orderBy: { number: 'desc' }, take: 1, select: { document: true } } },
    })
    if (!t) return null
    const { versions, ...rest } = toSummary(t)
    return { ...rest, document: (versions[0]?.document ?? {}) as ReportDocument }
  }

  async create(data: CreateTemplateData): Promise<TemplateDetail> {
    const t = await prisma.reportTemplate.create({
      data: {
        accountId: data.accountId,
        isSystem: data.isSystem ?? false,
        originId: data.originId ?? null,
        createdById: data.authorId,
        name: data.name,
        description: data.description,
        tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
        versions: {
          create: {
            number: 1,
            document: asJson(data.document),
            changeSummary: data.changeSummary,
            source: data.source ?? 'MANUAL',
            authorId: data.authorId,
          },
        },
      },
      select: summarySelect,
    })
    return { ...toSummary(t), document: data.document }
  }

  async update(templateId: string, data: UpdateTemplateData): Promise<TemplateDetail> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.reportTemplate.findUniqueOrThrow({ where: { id: templateId }, select: { currentVersion: true } })
      const nextVersion = data.document ? current.currentVersion + 1 : current.currentVersion
      if (data.document) {
        await tx.reportVersion.create({
          data: {
            templateId,
            number: nextVersion,
            document: asJson(data.document),
            changeSummary: data.changeSummary,
            source: data.source ?? 'MANUAL',
            authorId: data.authorId,
          },
        })
      }
      if (data.tagIds) {
        await tx.templateTag.deleteMany({ where: { templateId, tagId: { notIn: data.tagIds } } })
        await tx.templateTag.createMany({ data: data.tagIds.map((tagId) => ({ templateId, tagId })), skipDuplicates: true })
      }
      const t = await tx.reportTemplate.update({
        where: { id: templateId },
        data: { name: data.name, description: data.description, currentVersion: nextVersion },
        select: { ...summarySelect, versions: { orderBy: { number: 'desc' }, take: 1, select: { document: true } } },
      })
      const { versions, ...rest } = toSummary(t)
      return { ...rest, document: (versions[0]?.document ?? {}) as ReportDocument }
    })
  }

  async setPreviewFile(templateId: string, file: string | null) {
    const previous = await prisma.reportTemplate.findUnique({ where: { id: templateId }, select: { previewFile: true } })
    await prisma.reportTemplate.update({ where: { id: templateId }, data: { previewFile: file }, select: { id: true } })
    return previous?.previewFile ?? null
  }

  async archive(templateId: string) {
    await prisma.reportTemplate.update({ where: { id: templateId }, data: { archivedAt: new Date() } })
  }

  async listVersions(templateId: string) {
    const rows = await prisma.reportVersion.findMany({
      where: { templateId },
      orderBy: { number: 'desc' },
      select: { number: true, changeSummary: true, source: true, createdAt: true, author: { select: { name: true, avatarFile: true } } },
    })
    return rows.map(({ author, ...v }) => ({ ...v, authorName: author?.name ?? null, authorAvatarUrl: toPerson(author)?.avatarUrl ?? null }))
  }

  async findVersionDocument(templateId: string, number: number) {
    const v = await prisma.reportVersion.findUnique({
      where: { templateId_number: { templateId, number } },
      select: { document: true },
    })
    return v ? (v.document as ReportDocument) : null
  }

  async restoreVersion(templateId: string, number: number, authorId: string): Promise<TemplateDetail> {
    return prisma.$transaction(async (tx) => {
      const source = await tx.reportVersion.findUniqueOrThrow({ where: { templateId_number: { templateId, number } } })
      const current = await tx.reportTemplate.findUniqueOrThrow({ where: { id: templateId }, select: { currentVersion: true } })
      const next = current.currentVersion + 1
      await tx.reportVersion.create({
        data: {
          templateId,
          number: next,
          document: source.document as Prisma.InputJsonValue,
          changeSummary: `Restaurada a versão ${number}`,
          source: 'RESTORE',
          authorId,
        },
      })
      // a miniatura antiga já não representa o conteúdo: some e é regerada sob demanda
      const t = await tx.reportTemplate.update({ where: { id: templateId }, data: { currentVersion: next, previewFile: null }, select: summarySelect })
      return { ...toSummary(t), document: source.document as ReportDocument }
    })
  }
}
