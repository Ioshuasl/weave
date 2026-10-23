import { z } from 'zod'

export const mockDataJsonSchema = z.record(z.string().min(1), z.array(z.record(z.string(), z.unknown())))

/** Valida o texto JSON digitado pelo usuário: { "fonte": [ { "campo": "valor" } ] } */
export const parseMockDataJson = (text: string) => {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { error: 'JSON inválido. Verifique vírgulas, aspas e chaves.' } as const
  }
  const parsed = mockDataJsonSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: 'Use o formato { "fonte": [ { "campo": "valor" } ] } — cada fonte é uma lista de objetos.' } as const
  }
  return { data: parsed.data } as const
}
