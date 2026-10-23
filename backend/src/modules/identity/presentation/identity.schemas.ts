import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  username: z.preprocess(emptyToNull, z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{3,30}$/, 'Use 3 a 30 caracteres: letras, números, ponto ou _').nullable().optional()),
  jobRole: z.preprocess(emptyToNull, z.string().trim().max(80).nullable().optional()),
  timezone: z
    .string()
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('pt-BR', { timeZone: tz })
        return true
      } catch {
        return false
      }
    }, 'Fuso horário inválido')
    .optional(),
  website: z.preprocess(
    emptyToNull,
    z.string().trim().max(200).regex(/^[\w.-]+(\.[\w.-]+)+(\/\S*)?$/, 'Informe um endereço válido, ex.: meusite.com.br').nullable().optional(),
  ),
  bio: z.preprocess(emptyToNull, z.string().trim().max(300).nullable().optional()),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres').max(128),
})

export const sessionParamSchema = z.object({ id: z.string().uuid() })
