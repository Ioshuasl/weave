import { prisma } from '../../../shared/infra/prisma'
import type { MockData } from '../domain/ports'
import type { ReportDocument } from '../domain/ports'
import type { SharedTemplateView, ShareSettings, SharingRepository } from '../domain/sharing-ports'
import { summarySelect, toSummary } from './prisma-template.repository'

const settingsSelect = { shareMode: true, shareAllowCopy: true, shareToken: true } as const
const toSettings = (r: { shareMode: ShareSettings['mode']; shareAllowCopy: boolean; shareToken: string | null }): ShareSettings => ({
  mode: r.shareMode,
  allowCopy: r.shareAllowCopy,
  token: r.shareToken,
})

export class PrismaSharingRepository implements SharingRepository {
  async getSettings(templateId: string) {
    return toSettings(await prisma.reportTemplate.findUniqueOrThrow({ where: { id: templateId }, select: settingsSelect }))
  }

  async saveSettings(templateId: string, data: { mode: ShareSettings['mode']; allowCopy: boolean }, newToken: string) {
    const current = await prisma.reportTemplate.findUniqueOrThrow({ where: { id: templateId }, select: { shareToken: true } })
    const row = await prisma.reportTemplate.update({
      where: { id: templateId },
      data: {
        shareMode: data.mode,
        shareAllowCopy: data.allowCopy,
        // o link não muda ao desligar e religar: só nasce na primeira vez que é ligado
        shareToken: current.shareToken ?? (data.mode === 'OFF' ? null : newToken),
      },
      select: settingsSelect,
    })
    return toSettings(row)
  }

  async findByToken(token: string): Promise<SharedTemplateView | null> {
    const t = await prisma.reportTemplate.findFirst({
      where: { shareToken: token, shareMode: { not: 'OFF' }, archivedAt: null, isSystem: false },
      select: {
        ...summarySelect,
        ...settingsSelect,
        versions: { orderBy: { number: 'desc' }, take: 1, select: { document: true } },
        mockDatasets: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }], take: 1, select: { data: true } },
      },
    })
    if (!t) return null
    const { versions, mockDatasets, shareMode, shareAllowCopy, shareToken, ...rest } = t
    return {
      template: { ...toSummary(rest), document: (versions[0]?.document ?? {}) as ReportDocument },
      share: toSettings({ shareMode, shareAllowCopy, shareToken }),
      mockData: (mockDatasets[0]?.data ?? {}) as MockData,
    }
  }
}
