import { api } from '@/shared/lib/api'
import type { AccountSegmentEnum } from '@/shared/enums/AccountSegmentEnum'
import type { ShareModeEnum } from '@/shared/enums/ShareModeEnum'
import type { TemplateDetail } from '@/features/templates/types'
import type { ShareSettings, SharedTemplate, SharingState, Submission, SubmissionSnapshot } from '../types'

export const sharingService = {
  get: (templateId: string) => api<SharingState>(`/templates/${templateId}/sharing`, { tenant: true }),
  update: (templateId: string, body: { mode: ShareModeEnum; allowCopy: boolean }) =>
    api<ShareSettings>(`/templates/${templateId}/sharing`, { method: 'PUT', body, tenant: true }),
  submit: (templateId: string, body: { description?: string | null; segment?: AccountSegmentEnum | null; note?: string | null }) =>
    api<Submission>(`/templates/${templateId}/library-submissions`, { method: 'POST', body, tenant: true }),
  cancel: (templateId: string) => api(`/templates/${templateId}/library-submissions/pending`, { method: 'DELETE', tenant: true }),
  getShared: (token: string) => api<SharedTemplate>(`/shared/${token}`),
  copyShared: (token: string) => api<TemplateDetail>(`/shared/${token}/copy`, { method: 'POST', body: {}, tenant: true }),
  listSubmissions: (status?: string) => api<Submission[]>(`/support/library-submissions${status ? `?status=${status}` : ''}`, { tenant: true }),
  getSubmission: (id: string) => api<SubmissionSnapshot>(`/support/library-submissions/${id}`, { tenant: true }),
  approve: (id: string, body: { tagIds: string[]; name?: string }) =>
    api<TemplateDetail>(`/support/library-submissions/${id}/approve`, { method: 'POST', body, tenant: true }),
  reject: (id: string, note: string) => api(`/support/library-submissions/${id}/reject`, { method: 'POST', body: { note }, tenant: true }),
}
