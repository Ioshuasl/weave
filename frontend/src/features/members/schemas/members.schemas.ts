import { z } from 'zod'

export const inviteSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
})
export type InviteFormValues = z.infer<typeof inviteSchema>

export const acceptSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
})
export type AcceptFormValues = z.infer<typeof acceptSchema>

export const createMemberSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do funcionário'),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
  temporaryPassword: z.string().min(8, 'A senha provisória deve ter ao menos 8 caracteres'),
})
export type CreateMemberFormValues = z.infer<typeof createMemberSchema>

export const resetPasswordSchema = z.object({
  temporaryPassword: z.string().min(8, 'A senha provisória deve ter ao menos 8 caracteres'),
})
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
