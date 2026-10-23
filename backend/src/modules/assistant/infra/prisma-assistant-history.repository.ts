import type { Prisma } from '@prisma/client'
import { prisma } from '../../../shared/infra/prisma'
import type { AssistantHistoryRepository, InteractionKind, InteractionRecord } from '../domain/ports'

export class PrismaAssistantHistoryRepository implements AssistantHistoryRepository {
  async record(d: InteractionRecord) {
    await prisma.assistantInteraction.create({
      data: {
        templateId: d.templateId,
        accountId: d.accountId,
        userId: d.userId,
        sessionKey: d.sessionKey,
        request: d.request,
        message: d.message,
        actions: d.actions as Prisma.InputJsonValue,
        kind: d.kind,
        usage: (d.usage ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
  }

  async list(templateId: string, limit: number) {
    const rows = await prisma.assistantInteraction.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, request: true, message: true, kind: true, actions: true, createdAt: true, user: { select: { name: true, avatarFile: true } } },
    })
    return rows.map((r) => ({
      id: r.id,
      request: r.request,
      message: r.message,
      kind: r.kind as InteractionKind,
      actionCount: Array.isArray(r.actions) ? r.actions.length : 0,
      userName: r.user.name,
      userAvatarUrl: r.user.avatarFile ? `/avatars/${r.user.avatarFile}` : null,
      createdAt: r.createdAt,
    }))
  }
}
