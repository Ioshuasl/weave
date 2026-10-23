import { forbidden, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCan } from '../../../shared/security/permissions'
import type { MockData, MockDatasetRepository, MockDatasetView, TemplateRepository } from '../domain/ports'

const loadVisible = async (templates: TemplateRepository, tenant: TenantContext, templateId: string) => {
  const template = await templates.findVisible(tenant.accountId, templateId)
  if (!template) throw notFound('Modelo não encontrado')
  return template
}

const loadWritable = async (templates: TemplateRepository, tenant: TenantContext, templateId: string) => {
  assertCan(tenant.role, 'templates:write')
  const template = await loadVisible(templates, tenant, templateId)
  if (template.isSystem && !tenant.isSupport) throw forbidden('Modelos do sistema são somente leitura. Use "Usar modelo" para criar uma cópia.')
}

export class ListMockDatasetsUseCase {
  constructor(private readonly templates: TemplateRepository, private readonly datasets: MockDatasetRepository) {}

  async execute(data: { tenant: TenantContext; templateId: string }): Promise<MockDatasetView[]> {
    assertCan(data.tenant.role, 'templates:read')
    await loadVisible(this.templates, data.tenant, data.templateId)
    return this.datasets.list(data.templateId)
  }
}

export class CreateMockDatasetUseCase {
  constructor(private readonly templates: TemplateRepository, private readonly datasets: MockDatasetRepository) {}

  async execute(data: { tenant: TenantContext; templateId: string; name: string; data: MockData; isDefault?: boolean }) {
    await loadWritable(this.templates, data.tenant, data.templateId)
    const existing = await this.datasets.list(data.templateId)
    return this.datasets.create(data.templateId, {
      name: data.name,
      data: data.data,
      isDefault: data.isDefault ?? existing.length === 0,
    })
  }
}

export class UpdateMockDatasetUseCase {
  constructor(private readonly templates: TemplateRepository, private readonly datasets: MockDatasetRepository) {}

  async execute(data: { tenant: TenantContext; templateId: string; datasetId: string; name?: string; data?: MockData; isDefault?: boolean }) {
    await loadWritable(this.templates, data.tenant, data.templateId)
    if (!(await this.datasets.find(data.templateId, data.datasetId))) throw notFound('Dataset não encontrado')
    return this.datasets.update(data.datasetId, { name: data.name, data: data.data, isDefault: data.isDefault })
  }
}

export class DeleteMockDatasetUseCase {
  constructor(private readonly templates: TemplateRepository, private readonly datasets: MockDatasetRepository) {}

  async execute(data: { tenant: TenantContext; templateId: string; datasetId: string }): Promise<void> {
    await loadWritable(this.templates, data.tenant, data.templateId)
    if (!(await this.datasets.find(data.templateId, data.datasetId))) throw notFound('Dataset não encontrado')
    await this.datasets.remove(data.datasetId)
  }
}
