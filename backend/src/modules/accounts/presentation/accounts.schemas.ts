import { z } from 'zod'

const digits = (v: string) => v.replace(/\D/g, '')

const document = z
  .string()
  .transform(digits)
  .refine((v) => v.length === 11 || v.length === 14, 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)')

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres').max(128),
    accountType: z.enum(['PERSONAL', 'COMPANY']),
    accountName: z.string().trim().min(2).max(120).optional(),
    document: document.optional(),
    segment: z.enum(['CARTORIO', 'ADVOCACIA', 'CONTABILIDADE', 'VAREJO', 'CONSTRUCAO', 'MEI', 'EMPRESA', 'OUTRO']).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.accountType === 'COMPANY' && !v.accountName) {
      ctx.addIssue({ code: 'custom', path: ['accountName'], message: 'Informe o nome da empresa' })
    }
  })

export const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  document: document.nullable().optional(),
})
