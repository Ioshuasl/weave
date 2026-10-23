import type { AccountSegment, SubmissionStatus } from '@prisma/client'
import { AppError, conflict, forbidden, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCan } from '../../../shared/security/permissions'
import type { MockDatasetRepository, TagAccess, TemplateDetail, TemplateRepository } from '../domain/ports'
import type { LibrarySubmissionRepository, SubmissionSnapshot, SubmissionView } from '../domain/sharing-ports'

const assertSupport = (tenant: TenantContext) => {
  if (!tenant.isSupport) throw forbidden('Acesso restrito à equipe de suporte')
}

/** O autor pede para publicar o modelo na Biblioteca: fica uma cópia congelada aguardando a revisão do suporte. */
export class SubmitToLibraryUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly datasets: MockDatasetRepository,
    private readonly submissions: LibrarySubmissionRepository,
  ) {}

  async execute(data: { tenant: TenantContext; templateId: string; description?: string | null; segment?: AccountSegment | null; note?: string | null }): Promise<SubmissionView> {
    assertCan(data.tenant.role, 'templates:write')
    const template = await this.templates.findVisible(data.tenant.accountId, data.templateId)
    if (!template) throw notFound('Modelo não encontrado')
    if (template.isSystem) throw forbidden('Este modelo já está na biblioteca')
    if (await this.submissions.findPendingForTemplate(data.templateId)) throw conflict('Este modelo já está aguardando revisão')
    const dataset = (await this.datasets.list(data.templateId))[0] ?? null
    // a Biblioteca precisa dos dados de exemplo para montar a pré-visualização
    if (!dataset || Object.values(dataset.data).every((rows) => rows.length === 0)) {
      throw new AppError('NO_SAMPLE_DATA', 'Adicione dados de exemplo ao modelo (aba "Dados de exemplo") antes de enviá-lo: a Biblioteca os usa para mostrar a pré-visualização.', 422)
    }
    return this.submissions.create({
      templateId: data.templateId,
      accountId: data.tenant.accountId,
      submittedById: data.tenant.userId,
      name: template.name,
      description: data.description ?? template.description,
      segment: data.segment ?? null,
      note: data.note ?? null,
      versionNumber: template.currentVersion,
      document: template.document,
      mockDatasetName: dataset?.name ?? null,
      mockData: dataset?.data ?? null,
    })
  }
}

export class CancelSubmissionUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly submissions: LibrarySubmissionRepository,
  ) {}

  async execute(data: { tenant: TenantContext; templateId: string }): Promise<void> {
    assertCan(data.tenant.role, 'templates:write')
    if (!(await this.templates.findVisible(data.tenant.accountId, data.templateId))) throw notFound('Modelo não encontrado')
    const pending = await this.submissions.findPendingForTemplate(data.templateId)
    if (!pending) throw notFound('Não há pedido aguardando revisão')
    await this.submissions.remove(pending.id)
  }
}

export class ListSubmissionsUseCase {
  constructor(private readonly submissions: LibrarySubmissionRepository) {}

  execute(data: { tenant: TenantContext; status?: SubmissionStatus }): Promise<SubmissionView[]> {
    assertSupport(data.tenant)
    return this.submissions.list(data.status)
  }
}

export class GetSubmissionUseCase {
  constructor(private readonly submissions: LibrarySubmissionRepository) {}

  async execute(data: { tenant: TenantContext; id: string }): Promise<SubmissionSnapshot> {
    assertSupport(data.tenant)
    const submission = await this.submissions.findById(data.id)
    if (!submission) throw notFound('Pedido não encontrado')
    return submission
  }
}

/** Aprova: cria o modelo na Biblioteca (visível a todas as contas) com o autor original e os dados de exemplo congelados. */
export class ApproveSubmissionUseCase {
  constructor(
    private readonly submissions: LibrarySubmissionRepository,
    private readonly templates: TemplateRepository,
    private readonly datasets: MockDatasetRepository,
    private readonly tags: TagAccess,
  ) {}

  async execute(data: { tenant: TenantContext; id: string; tagIds: string[]; name?: string }): Promise<TemplateDetail> {
    assertSupport(data.tenant)
    const submission = await this.submissions.findById(data.id)
    if (!submission) throw notFound('Pedido não encontrado')
    if (submission.status !== 'PENDING') throw conflict('Este pedido já foi respondido')
    await this.tags.assertUsable(data.tenant.accountId, data.tagIds, { systemOnly: true })
    const published = await this.templates.create({
      accountId: null,
      isSystem: true,
      // o autor do pedido aparece como criador do modelo na biblioteca
      authorId: submission.submittedById,
      name: data.name ?? submission.name,
      description: submission.description,
      tagIds: data.tagIds,
      document: submission.document,
      changeSummary: 'Publicado na biblioteca',
    })
    if (submission.mockData) await this.datasets.create(published.id, { name: submission.mockDatasetName ?? 'Exemplo', data: submission.mockData, isDefault: true })
    await this.submissions.markApproved(submission.id, data.tenant.userId, published.id)
    return published
  }
}

export class RejectSubmissionUseCase {
  constructor(private readonly submissions: LibrarySubmissionRepository) {}

  async execute(data: { tenant: TenantContext; id: string; note: string }): Promise<void> {
    assertSupport(data.tenant)
    const submission = await this.submissions.findById(data.id)
    if (!submission) throw notFound('Pedido não encontrado')
    if (submission.status !== 'PENDING') throw conflict('Este pedido já foi respondido')
    await this.submissions.markRejected(submission.id, data.tenant.userId, data.note)
  }
}
