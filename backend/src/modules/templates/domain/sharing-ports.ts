import type { AccountSegment, ShareMode, SubmissionStatus } from '@prisma/client'
import type { MockData, PersonView, ReportDocument, TemplateDetail } from './ports'

export interface ShareSettings {
  mode: ShareMode
  allowCopy: boolean
  token: string | null
}

export interface SharedTemplateView {
  template: TemplateDetail
  share: ShareSettings
  /** dados de exemplo padrão do modelo (a pré-visualização pública usa só estes) */
  mockData: MockData
}

export interface SharingRepository {
  getSettings(templateId: string): Promise<ShareSettings>
  /** grava o modo; o token só é criado na primeira vez que o link é ligado (`newToken`) e depois é mantido */
  saveSettings(templateId: string, data: { mode: ShareMode; allowCopy: boolean }, newToken: string): Promise<ShareSettings>
  findByToken(token: string): Promise<SharedTemplateView | null>
}

export interface SubmissionView {
  id: string
  templateId: string
  templateName: string
  status: SubmissionStatus
  name: string
  description: string | null
  segment: AccountSegment | null
  note: string | null
  versionNumber: number
  reviewNote: string | null
  publishedTemplateId: string | null
  accountName: string | null
  submittedBy: PersonView
  createdAt: Date
  reviewedAt: Date | null
}

/** Cópia congelada que o suporte revisa. */
export interface SubmissionSnapshot extends SubmissionView {
  submittedById: string
  document: ReportDocument
  mockDatasetName: string | null
  mockData: MockData | null
}

export interface NewSubmission {
  templateId: string
  accountId: string
  submittedById: string
  name: string
  description: string | null
  segment: AccountSegment | null
  note: string | null
  versionNumber: number
  document: ReportDocument
  mockDatasetName: string | null
  mockData: MockData | null
}

export interface LibrarySubmissionRepository {
  create(data: NewSubmission): Promise<SubmissionView>
  findLatestForTemplate(templateId: string): Promise<SubmissionView | null>
  findPendingForTemplate(templateId: string): Promise<SubmissionView | null>
  findById(id: string): Promise<SubmissionSnapshot | null>
  list(status?: SubmissionStatus): Promise<SubmissionView[]>
  remove(id: string): Promise<void>
  markApproved(id: string, reviewerId: string, publishedTemplateId: string): Promise<void>
  markRejected(id: string, reviewerId: string, reviewNote: string): Promise<void>
}
