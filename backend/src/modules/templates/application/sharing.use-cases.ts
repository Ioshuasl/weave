import { randomBytes } from 'node:crypto'
import type { ShareMode } from '@prisma/client'
import { AppError, forbidden, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCan } from '../../../shared/security/permissions'
import type { MockDatasetRepository, PersonView, ReportDocument, TemplateDetail, TemplateRepository, TemplateTagView } from '../domain/ports'
import type { LibrarySubmissionRepository, ShareSettings, SharingRepository, SubmissionView } from '../domain/sharing-ports'

const ownTemplate = async (templates: TemplateRepository, tenant: TenantContext, templateId: string) => {
  const template = await templates.findVisible(tenant.accountId, templateId)
  if (!template) throw notFound('Modelo não encontrado')
  if (template.isSystem) throw forbidden('Modelos da biblioteca não podem ser compartilhados')
  return template
}

export interface SharingState {
  share: ShareSettings
  submission: SubmissionView | null
}

export class GetSharingUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly sharing: SharingRepository,
    private readonly submissions: LibrarySubmissionRepository,
  ) {}

  async execute(data: { tenant: TenantContext; templateId: string }): Promise<SharingState> {
    assertCan(data.tenant.role, 'templates:read')
    await ownTemplate(this.templates, data.tenant, data.templateId)
    return {
      share: await this.sharing.getSettings(data.templateId),
      submission: await this.submissions.findLatestForTemplate(data.templateId),
    }
  }
}

export class UpdateSharingUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly sharing: SharingRepository,
  ) {}

  async execute(data: { tenant: TenantContext; templateId: string; mode: ShareMode; allowCopy: boolean }): Promise<ShareSettings> {
    assertCan(data.tenant.role, 'templates:write')
    await ownTemplate(this.templates, data.tenant, data.templateId)
    return this.sharing.saveSettings(data.templateId, { mode: data.mode, allowCopy: data.allowCopy }, randomBytes(18).toString('base64url'))
  }
}

export interface SharedTemplatePayload {
  name: string
  description: string | null
  tags: TemplateTagView[]
  document: ReportDocument
  mockData: Record<string, Record<string, unknown>[]>
  mode: ShareMode
  allowCopy: boolean
  author: PersonView | null
  updatedAt: Date
}

export class GetSharedTemplateUseCase {
  constructor(private readonly sharing: SharingRepository) {}

  async execute(data: { token: string; userId?: string }): Promise<SharedTemplatePayload> {
    const shared = await this.sharing.findByToken(data.token)
    if (!shared) throw notFound('Este link não está mais disponível')
    if (shared.share.mode === 'MEMBERS' && !data.userId) {
      throw new AppError('LOGIN_REQUIRED', 'Este modelo foi compartilhado apenas com quem tem conta no Weave. Entre para visualizar.', 401)
    }
    const { template, share } = shared
    return {
      name: template.name,
      description: template.description,
      tags: template.tags,
      document: template.document,
      mockData: shared.mockData,
      mode: share.mode,
      allowCopy: share.allowCopy,
      author: template.createdBy,
      updatedAt: template.updatedAt,
    }
  }
}

/** "Usar este modelo": cria na conta de quem abriu o link uma cópia do modelo compartilhado (só se o autor permitiu). */
export class CopySharedTemplateUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly sharing: SharingRepository,
    private readonly datasets: MockDatasetRepository,
  ) {}

  async execute(data: { tenant: TenantContext; token: string }): Promise<TemplateDetail> {
    assertCan(data.tenant.role, 'templates:write')
    const shared = await this.sharing.findByToken(data.token)
    if (!shared) throw notFound('Este link não está mais disponível')
    if (!shared.share.allowCopy) throw forbidden('O autor não permitiu criar cópias deste modelo')
    const { template, mockData } = shared
    const copy = await this.templates.create({
      accountId: data.tenant.accountId,
      authorId: data.tenant.userId,
      name: template.name,
      description: template.description,
      originId: template.originId ?? template.id,
      // tags de outra conta não valem aqui: só as do sistema acompanham a cópia
      tagIds: template.tags.filter((t) => t.system).map((t) => t.id),
      document: template.document,
      changeSummary: `Criado a partir de um modelo compartilhado ("${template.name}")`,
    })
    if (Object.keys(mockData).length > 0) await this.datasets.create(copy.id, { name: 'Exemplo', data: mockData, isDefault: true })
    return copy
  }
}
