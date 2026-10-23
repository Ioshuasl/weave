import { z } from 'zod'

const httpsUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((v) => v.startsWith('https://'), 'Use um link https://')

export const idParam = z.object({ id: z.string().uuid() })

export const trackSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullish(),
  position: z.number().int().min(0).max(10000).optional(),
  published: z.boolean().optional(),
})
export const trackUpdateSchema = trackSchema.partial()

export const lessonSchema = z.object({
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(500).nullish(),
  contentMd: z.string().max(50_000).optional(),
  videoUrl: httpsUrl.nullish(),
  durationMin: z.number().int().min(1).max(600).nullish(),
  position: z.number().int().min(0).max(10000).optional(),
  published: z.boolean().optional(),
})
export const lessonUpdateSchema = lessonSchema.partial()
