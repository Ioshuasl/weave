import { forbidden, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCan } from '../../../shared/security/permissions'
import { diffReportDocuments, type ReportDiff } from '../domain/report-diff'
import type {
  MockDatasetRepository,
  ReportDocument,
  TagAccess,
  TemplateDetail,
  TemplateFilters,
  TemplateRepository,
  TemplateSummary,
  VersionSummary,
} from '../domain/ports'

const EMPTY_DOCUMENT: ReportDocument = { version: 1, pages: [{ elements: [] }] }

const findOwned = async (repo: TemplateRepository, tenant: TenantContext, id: string) => {
  const template = await repo.findVisible(tenant.accountId, id)
  if (!template) throw notFound('Modelo não encontrado')
  if (template.isSystem && !tenant.isSupport) throw forbidden('Modelos do sistema são somente leitura. Use "Usar modelo" para criar uma cópia.')
  return template
}

export class ListTemplatesUseCase {
  constructor(private readonly templates: TemplateRepository) {}

  execute(data: { tenant: TenantContext; filters: TemplateFilters }): Promise<TemplateSummary[]> {
    assertCan(data.tenant.role, 'templates:read')
    return this.templates.list(data.tenant.accountId, data.filters)
  }
}

export class GetTemplateUseCase {
  constructor(private readonly templates: TemplateRepository) {}

  async execute(data: { tenant: TenantContext; templateId: string }): Promise<TemplateDetail> {
    assertCan(data.tenant.role, 'templates:read')
    const template = await this.templates.findVisible(data.tenant.accountId, data.templateId)
    if (!template) throw notFound('Modelo não encontrado')
    return template
  }
}

export class CreateTemplateUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly tags: TagAccess,
  ) {}

  async execute(data: {
    tenant: TenantContext
    name: string
    description?: string | null
    tagIds: string[]
    document?: ReportDocument
  }): Promise<TemplateDetail> {
    assertCan(data.tenant.role, 'templates:write')
    await this.tags.assertUsable(data.tenant.accountId, data.tagIds, { systemOnly: false })
    return this.templates.create({
      accountId: data.tenant.accountId,
      authorId: data.tenant.userId,
      name: data.name,
      description: data.description,
      tagIds: data.tagIds,
      document: data.document ?? EMPTY_DOCUMENT,
      changeSummary: 'Modelo criado',
    })
  }
}

export class DuplicateTemplateUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly datasets: MockDatasetRepository,
  ) {}

  async execute(data: { tenant: TenantContext; templateId: string; name?: string }): Promise<TemplateDetail> {
    assertCan(data.tenant.role, 'templates:write')
    const source = await this.templates.findVisible(data.tenant.accountId, data.templateId)
    if (!source) throw notFound('Modelo não encontrado')
    const copy = await this.templates.create({
      accountId: data.tenant.accountId,
      authorId: data.tenant.userId,
      name: data.name ?? (source.isSystem ? source.name : `${source.name} (cópia)`),
      description: source.description,
      // cópias do mesmo modelo se agrupam na galeria pela raiz da cadeia
      originId: source.originId ?? source.id,
      tagIds: source.tags.map((t) => t.id),
      document: source.document,
      changeSummary: `Criado a partir de "${source.name}"`,
    })
    await this.datasets.copyAll(source.id, copy.id)
    return copy
  }
}

export class UpdateTemplateUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly tags: TagAccess,
  ) {}

  async execute(data: {
    tenant: TenantContext
    templateId: string
    name?: string
    description?: string | null
    tagIds?: string[]
    document?: ReportDocument
    changeSummary?: string
    source?: 'MANUAL' | 'ASSISTANT'
  }): Promise<TemplateDetail> {
    assertCan(data.tenant.role, 'templates:write')
    const template = await findOwned(this.templates, data.tenant, data.templateId)
    if (data.tagIds) await this.tags.assertUsable(data.tenant.accountId, data.tagIds, { systemOnly: template.isSystem })
    return this.templates.update(data.templateId, {
      name: data.name,
      description: data.description,
      tagIds: data.tagIds,
      document: data.document,
      changeSummary: data.changeSummary,
      source: data.source,
      authorId: data.tenant.userId,
    })
  }
}

export class ArchiveTemplateUseCase {
  constructor(private readonly templates: TemplateRepository) {}

  async execute(data: { tenant: TenantContext; templateId: string }): Promise<void> {
    assertCan(data.tenant.role, 'templates:write')
    await findOwned(this.templates, data.tenant, data.templateId)
    await this.templates.archive(data.templateId)
  }
}

export class ListVersionsUseCase {
  constructor(private readonly templates: TemplateRepository) {}

  async execute(data: { tenant: TenantContext; templateId: string }): Promise<VersionSummary[]> {
    assertCan(data.tenant.role, 'templates:read')
    const template = await this.templates.findVisible(data.tenant.accountId, data.templateId)
    if (!template) throw notFound('Modelo não encontrado')
    return this.templates.listVersions(data.templateId)
  }
}

export class RestoreVersionUseCase {
  constructor(private readonly templates: TemplateRepository) {}

  async execute(data: { tenant: TenantContext; templateId: string; number: number }): Promise<TemplateDetail> {
    assertCan(data.tenant.role, 'templates:write')
    await findOwned(this.templates, data.tenant, data.templateId)
    if (!(await this.templates.findVersionDocument(data.templateId, data.number))) throw notFound('Versão não encontrada')
    return this.templates.restoreVersion(data.templateId, data.number, data.tenant.userId)
  }
}

export class DiffVersionUseCase {
  constructor(private readonly templates: TemplateRepository) {}

  /** Mudanças introduzidas pela versão `number` em relação à anterior (ou a `against`). */
  async execute(data: { tenant: TenantContext; templateId: string; number: number; against?: number }): Promise<ReportDiff> {
    assertCan(data.tenant.role, 'templates:read')
    if (!(await this.templates.findVisible(data.tenant.accountId, data.templateId))) throw notFound('Modelo não encontrado')
    const after = await this.templates.findVersionDocument(data.templateId, data.number)
    if (!after) throw notFound('Versão não encontrada')
    const base = data.against ?? data.number - 1
    const before = base >= 1 ? await this.templates.findVersionDocument(data.templateId, base) : {}
    if (!before) throw notFound('Versão de comparação não encontrada')
    return diffReportDocuments(before, after)
  }
}
