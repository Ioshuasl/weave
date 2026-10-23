import { z } from 'zod'

const str = (max: number) => z.string().max(max)

const coluna = z.object({ id: z.string().min(1).max(64), campo: str(64), titulo: str(80).default('') })
const componente = z.object({
  id: z.string().min(1).max(64),
  tipo: z.string().min(1).max(16),
  nome: str(80).default(''),
  conteudo: str(2000).default(''),
})
const banda = z.object({
  id: z.string().min(1).max(64),
  tipo: z.string().min(1).max(32),
  nome: str(80).default(''),
  fonte: str(64).default(''),
  vinculo: z.object({ pai: str(64).default(''), posicao: str(16).default('') }).nullish(),
  condicao: z.object({ campo: str(64).default(''), operador: str(16).default(''), valor: str(64).default('') }).nullish(),
  linhas: z.record(z.string(), z.unknown()).nullish(),
  colunas: z.array(coluna).max(40).default([]),
  componentes: z.array(componente).max(40).default([]),
})

export const assistantRequestSchema = z.object({
  sessao_id: z.string().min(8).max(40).regex(/^[\w-]+$/),
  pedido: z.string().min(3).max(1000),
  modo: z.enum(['normal', 'passo']).default('normal'),
  selecao: z
    .object({ componentes: z.array(z.string()).max(50).default([]), bandas: z.array(z.string()).max(50).default([]) })
    .default({ componentes: [], bandas: [] }),
  relatorio: z.object({ bandas: z.array(banda).max(60) }),
  campos: z
    .array(z.object({ fonte: z.string().min(1).max(64), campo: z.string().min(1).max(64), rotulo: str(80).default('') }))
    .max(300)
    .default([]),
  colunas_layout: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        rotulo: str(80).default(''),
        campo: str(64).default(''),
        banda_id: str(64).default(''),
        x: z.number().default(0),
        largura: z.number().default(0),
      }),
    )
    .max(40)
    .default([]),
  imagens: z
    .array(
      z.object({
        nome: str(80).default('imagem'),
        tipo: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        base64: z.string().min(100).max(2_700_000),
      }),
    )
    .max(3)
    .default([]),
})
