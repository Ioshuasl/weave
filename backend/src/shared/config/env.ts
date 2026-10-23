import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  /** Assistente de IA (workflow n8n). Sem URL/usuário o assistente fica desligado (503). */
  N8N_ASSISTANT_URL: z.string().url().optional(),
  N8N_BASIC_USER: z.string().optional(),
  N8N_BASIC_PASSWORD: z.string().optional(),
  N8N_ASSISTANT_TIMEOUT_SECONDS: z.coerce.number().positive().default(100),
  /** Arquivos enviados (fotos de perfil). */
  STORAGE_DIR: z.string().default('storage'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
})

export const env = schema.parse(process.env)
