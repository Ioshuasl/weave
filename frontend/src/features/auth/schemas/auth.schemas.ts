import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    accountType: z.enum(['PERSONAL', 'COMPANY']),
    name: z.string().trim().min(2, 'Informe seu nome'),
    accountName: z.string().trim().optional(),
    document: z
      .string()
      .optional()
      .refine((v) => !v || [11, 14].includes(v.replace(/\D/g, '').length), 'Informe um CPF ou CNPJ válido'),
    segment: z.string().optional(),
    email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
  })
  .superRefine((v, ctx) => {
    if (v.accountType === 'COMPANY' && !v.accountName) {
      ctx.addIssue({ code: 'custom', path: ['accountName'], message: 'Informe o nome da empresa' })
    }
  })
export type RegisterFormValues = z.infer<typeof registerSchema>
