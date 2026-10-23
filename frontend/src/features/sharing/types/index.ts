import type { ShareModeEnum } from '@/shared/enums/ShareModeEnum'
import type { SubmissionStatusEnum } from '@/shared/enums/SubmissionStatusEnum'
import type { AccountSegmentEnum } from '@/shared/enums/AccountSegmentEnum'
import type { Person, MockData } from '@/features/templates/types'
import type { Tag } from '@/features/tags/types'

export interface ShareSettings {
  mode: ShareModeEnum
  allowCopy: boolean
  token: string | null
}

export interface Submission {
  id: string
  templateId: string
  templateName: string
  status: SubmissionStatusEnum
  name: string
  description: string | null
  segment: AccountSegmentEnum | null
  note: string | null
  versionNumber: number
  reviewNote: string | null
  publishedTemplateId: string | null
  accountName: string | null
  submittedBy: Person
  createdAt: string
  reviewedAt: string | null
}

export interface SharingState {
  share: ShareSettings
  submission: Submission | null
}

/** O que a página pública/revisão precisa para desenhar o modelo. */
export interface PreviewableTemplate {
  name: string
  description: string | null
  document: Record<string, unknown>
  mockData: MockData
}

export interface SharedTemplate extends PreviewableTemplate {
  tags: Tag[]
  mode: ShareModeEnum
  allowCopy: boolean
  author: Person | null
  updatedAt: string
}

export interface SubmissionSnapshot extends Submission, Omit<PreviewableTemplate, 'name' | 'description'> {
  mockDatasetName: string | null
}
