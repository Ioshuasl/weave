import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  username: z.string().trim().toLowerCase().refine((v) => v === '' || /^[a-z0-9_.]{3,30}$/.test(v), 'Use 3 a 30 caracteres: letras, números, ponto ou _'),
  jobRole: z.string().trim().max(80),
  timezone: z.string().min(1),
  website: z.string().trim().max(200).refine((v) => v === '' || /^[\w.-]+(\.[\w.-]+)+(\/\S*)?$/.test(v), 'Informe um endereço válido, ex.: meusite.com.br'),
  bio: z.string().trim().max(300, 'Máximo de 300 caracteres'),
})
export type ProfileFormValues = z.infer<typeof profileSchema>

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não conferem' })
export type PasswordFormValues = z.infer<typeof passwordSchema>
