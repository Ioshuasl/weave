import { z } from 'zod'

const tagIds = z.array(z.string().uuid()).max(20)
const document = z.record(z.string(), z.unknown())

export const listQuerySchema = z.object({
  tagId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
})

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullish(),
  tagIds: tagIds.default([]),
  document: document.optional(),
})

export const duplicateTemplateSchema = z.object({ name: z.string().trim().min(2).max(120).optional() })

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).nullish(),
  tagIds: tagIds.optional(),
  document: document.optional(),
  changeSummary: z.string().trim().max(200).optional(),
  source: z.enum(['MANUAL', 'ASSISTANT']).optional(),
})

export const templateParamSchema = z.object({ id: z.string().uuid() })
export const versionParamSchema = z.object({ id: z.string().uuid(), number: z.coerce.number().int().positive() })

const mockData = z.record(z.string().min(1).max(60), z.array(z.record(z.string(), z.unknown())).max(2000))

export const createMockDatasetSchema = z.object({
  name: z.string().trim().min(2).max(120),
  data: mockData,
  isDefault: z.boolean().optional(),
})
export const updateMockDatasetSchema = createMockDatasetSchema.partial()
export const datasetParamSchema = z.object({ id: z.string().uuid(), datasetId: z.string().uuid() })

export const createSystemTemplateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullish(),
  tagIds: tagIds.default([]),
})
export const publishTemplateSchema = z.object({ name: z.string().trim().min(2).max(120).optional() })

export const shareSettingsSchema = z.object({
  mode: z.enum(['OFF', 'PUBLIC', 'MEMBERS']),
  allowCopy: z.boolean(),
})

const segment = z.enum(['CARTORIO', 'ADVOCACIA', 'CONTABILIDADE', 'VAREJO', 'CONSTRUCAO', 'MEI', 'EMPRESA', 'OUTRO'])

export const submitToLibrarySchema = z.object({
  description: z.string().trim().max(500).nullish(),
  segment: segment.nullish(),
  note: z.string().trim().max(500).nullish(),
})

export const tokenParamSchema = z.object({ token: z.string().min(10).max(100) })
export const submissionParamSchema = z.object({ id: z.string().uuid() })
export const submissionQuerySchema = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional() })
export const approveSubmissionSchema = z.object({ tagIds: tagIds.default([]), name: z.string().trim().min(2).max(120).optional() })
export const rejectSubmissionSchema = z.object({ note: z.string().trim().min(3, 'Explique o motivo para o autor').max(500) })
