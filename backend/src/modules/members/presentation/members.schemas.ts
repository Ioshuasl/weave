import { z } from 'zod'

const assignableRole = z.enum(['ADMIN', 'EDITOR', 'VIEWER'])

export const inviteSchema = z.object({ email: z.string().email(), role: assignableRole })
export const changeRoleSchema = z.object({ role: assignableRole })
export const acceptSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres').max(128).optional(),
})
export const idParamSchema = z.object({ id: z.string().uuid() })
export const tokenParamSchema = z.object({ token: z.string().min(10) })

const temporaryPassword = z.string().min(8, 'A senha provisória deve ter ao menos 8 caracteres').max(128)

export const createManagedSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  role: assignableRole,
  temporaryPassword,
})
export const resetPasswordSchema = z.object({ temporaryPassword })
