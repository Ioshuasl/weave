import { forbidden, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import type { MockDatasetRepository, ReportDocument, TagAccess, TemplateDetail, TemplateRepository } from '../domain/ports'

const assertSupport = (tenant: TenantContext) => {
  if (!tenant.isSupport) throw forbidden('Acesso restrito à equipe de suporte')
}

const EMPTY_DOCUMENT: ReportDocument = { version: 1, pages: [{ elements: [] }] }

/** Cria um modelo pronto (do sistema) em branco, visível para todas as contas. */
export class CreateSystemTemplateUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly tags: TagAccess,
  ) {}

  async execute(data: { tenant: TenantContext; name: string; description?: string | null; tagIds: string[] }): Promise<TemplateDetail> {
    assertSupport(data.tenant)
    await this.tags.assertUsable(data.tenant.accountId, data.tagIds, { systemOnly: true })
    return this.templates.create({
      accountId: null,
      isSystem: true,
      authorId: data.tenant.userId,
      name: data.name,
      description: data.description,
      tagIds: data.tagIds,
      document: EMPTY_DOCUMENT,
      changeSummary: 'Modelo pronto criado',
    })
  }
}

/** Publica uma cópia de um modelo existente (ex.: da conta do suporte) como modelo pronto, com seus dados fictícios. */
export class PublishTemplateAsSystemUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly datasets: MockDatasetRepository,
  ) {}

  async execute(data: { tenant: TenantContext; templateId: string; name?: string }): Promise<TemplateDetail> {
    assertSupport(data.tenant)
    const source = await this.templates.findVisible(data.tenant.accountId, data.templateId)
    if (!source) throw notFound('Modelo não encontrado')
    const copy = await this.templates.create({
      accountId: null,
      isSystem: true,
      authorId: data.tenant.userId,
      name: data.name ?? source.name,
      description: source.description,
      // modelo pronto é visível a todas as contas: só leva tags do sistema
      tagIds: source.tags.filter((t) => t.system).map((t) => t.id),
      document: source.document,
      changeSummary: `Publicado a partir de "${source.name}"`,
    })
    await this.datasets.copyAll(source.id, copy.id)
    return copy
  }
}
