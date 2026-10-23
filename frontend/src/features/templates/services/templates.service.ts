import { api } from '@/shared/lib/api'
import type { TemplateFormValues } from '../schemas/templates.schemas'
import type { VersionDiff, MockData, MockDataset, TemplateDetail, TemplateSummary, VersionSummary } from '../types'

export const templatesService = {
  list: () => api<TemplateSummary[]>('/templates', { tenant: true }),
  get: (id: string) => api<TemplateDetail>(`/templates/${id}`, { tenant: true }),
  create: (data: TemplateFormValues) => api<TemplateDetail>('/templates', { method: 'POST', body: data, tenant: true }),
  update: (id: string, data: TemplateFormValues) =>
    api<TemplateDetail>(`/templates/${id}`, { method: 'PATCH', body: data, tenant: true }),
  patch: (id: string, body: { name?: string; description?: string | null; tagIds?: string[] }) =>
    api<TemplateDetail>(`/templates/${id}`, { method: 'PATCH', body, tenant: true }),
  duplicate: (id: string) => api<TemplateDetail>(`/templates/${id}/duplicate`, { method: 'POST', body: {}, tenant: true }),
  saveDocument: (id: string, document: Record<string, unknown>, changeSummary?: string, source: 'MANUAL' | 'ASSISTANT' = 'MANUAL') =>
    api<TemplateDetail>(`/templates/${id}`, { method: 'PATCH', body: { document, changeSummary, source }, tenant: true }),
  diff: (id: string, number: number) => api<VersionDiff>(`/templates/${id}/versions/${number}/diff`, { tenant: true }),
  listDatasets: (id: string) => api<MockDataset[]>(`/templates/${id}/mock-datasets`, { tenant: true }),
  createDataset: (id: string, body: { name: string; data: MockData; isDefault?: boolean }) =>
    api<MockDataset>(`/templates/${id}/mock-datasets`, { method: 'POST', body, tenant: true }),
  updateDataset: (id: string, datasetId: string, body: { name?: string; data?: MockData; isDefault?: boolean }) =>
    api<MockDataset>(`/templates/${id}/mock-datasets/${datasetId}`, { method: 'PATCH', body, tenant: true }),
  deleteDataset: (id: string, datasetId: string) =>
    api(`/templates/${id}/mock-datasets/${datasetId}`, { method: 'DELETE', tenant: true }),
  createSystem: (data: TemplateFormValues) => api<TemplateDetail>('/support/templates', { method: 'POST', body: data, tenant: true }),
  publishAsSystem: (id: string) => api<TemplateDetail>(`/support/templates/${id}/publish`, { method: 'POST', body: {}, tenant: true }),
  uploadPreview: (id: string, blob: Blob) => api<{ previewUrl: string }>(`/templates/${id}/preview`, { method: 'PUT', blob, tenant: true }),
  archive: (id: string) => api(`/templates/${id}`, { method: 'DELETE', tenant: true }),
  versions: (id: string) => api<VersionSummary[]>(`/templates/${id}/versions`, { tenant: true }),
  restore: (id: string, number: number) =>
    api<TemplateDetail>(`/templates/${id}/versions/${number}/restore`, { method: 'POST', tenant: true }),
}
