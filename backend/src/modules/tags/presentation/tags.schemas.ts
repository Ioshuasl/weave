import { TagColor } from '@prisma/client'
import { z } from 'zod'

const name = z.string().trim().min(1, 'Informe o nome da tag').max(40)
const color = z.nativeEnum(TagColor)

export const createTagSchema = z.object({ name, color: color.optional(), system: z.boolean().optional() })
export const updateTagSchema = z.object({ name: name.optional(), color: color.optional() })
export const tagParamSchema = z.object({ id: z.string().uuid() })
