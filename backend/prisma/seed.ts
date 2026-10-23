import { PrismaClient, type Prisma, type TagColor } from '@prisma/client'
import { readdirSync, readFileSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import path from 'node:path'

/**
 * Modelos prontos: um JSON por modelo em prisma/system-templates (relatório no formato do motor Weave + dados de exemplo).
 * Origem: seeders/migrations `seed_g_config_relatorio_*` das releases DTP2610, DGS2610 e DSAAS2610 do repositório api.
 *
 *   npm run seed                  → cria o que faltar (não mexe no que já existe)
 *   npm run seed:replace-system   → apaga TODOS os modelos prontos atuais e recria a partir dos JSON
 */
const prisma = new PrismaClient()
const REPLACE = process.argv.includes('--replace')
const FIXTURES_DIR = path.resolve(__dirname, 'system-templates')
const PREVIEWS_DIR = path.resolve(process.env.STORAGE_DIR ?? 'storage', 'previews')

interface Fixture {
  order: number
  name: string
  description: string
  tags: string[]
  report: Prisma.InputJsonValue
  mockData: Prisma.InputJsonValue
}

const SYSTEM_TAGS: { name: string; color: TagColor }[] = [
  { name: 'Notariado', color: 'BLUE' },
  { name: 'Protesto', color: 'RED' },
  { name: 'Registro Civil', color: 'GREEN' },
  { name: 'Imóveis', color: 'ORANGE' },
  { name: 'RTD/RCPJ', color: 'PURPLE' },
  { name: 'Outros', color: 'GRAY' },
  // tipo de documento
  { name: 'Livro', color: 'BROWN' },
  { name: 'Relatório', color: 'DEFAULT' },
  { name: 'Intimação/Edital', color: 'YELLOW' },
  { name: 'Certidão/Instrumento', color: 'PINK' },
  { name: 'Recibo', color: 'GREEN' },
]

const loadFixtures = (): Fixture[] =>
  readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(path.join(FIXTURES_DIR, f), 'utf8')) as Fixture)

const ensureSystemTags = async () => {
  for (const t of SYSTEM_TAGS) {
    const exists = await prisma.tag.findFirst({ where: { accountId: null, name: t.name } })
    if (!exists) await prisma.tag.create({ data: { accountId: null, ...t } })
  }
}

const removeSystemTemplates = async () => {
  const old = await prisma.reportTemplate.findMany({ where: { isSystem: true }, select: { id: true, previewFile: true } })
  for (const t of old) if (t.previewFile) await unlink(path.join(PREVIEWS_DIR, path.basename(t.previewFile))).catch(() => undefined)
  // versões, dados de exemplo e vínculos de tags saem em cascata; cópias dos usuários perdem só o vínculo de origem
  await prisma.reportTemplate.deleteMany({ where: { isSystem: true } })
  console.log(`Modelos prontos removidos: ${old.length}`)
}

const seedSystemTemplates = async () => {
  const tagIdByName = new Map((await prisma.tag.findMany({ where: { accountId: null } })).map((t) => [t.name, t.id]))
  let created = 0
  for (const fx of loadFixtures()) {
    if (await prisma.reportTemplate.findFirst({ where: { isSystem: true, name: fx.name, archivedAt: null } })) continue
    await prisma.reportTemplate.create({
      data: {
        name: fx.name,
        description: fx.description,
        isSystem: true,
        tags: { create: fx.tags.map((name) => ({ tagId: tagIdByName.get(name)! })) },
        versions: { create: { number: 1, document: fx.report, changeSummary: 'Modelo do sistema', source: 'MANUAL' } },
        mockDatasets: { create: { name: 'Exemplo', data: fx.mockData, isDefault: true } },
      },
    })
    created++
  }
  console.log(`Modelos prontos criados: ${created}`)
}

const seedTraining = async () => {
  if ((await prisma.trainingTrack.count()) > 0) return
  await prisma.trainingTrack.create({
    data: {
      title: 'Primeiros passos',
      description: 'Do modelo pronto ao relatório salvo, em poucos minutos.',
      position: 0,
      published: true,
      lessons: {
        create: [
          {
            title: 'Escolha um modelo pronto',
            summary: 'Encontre e use um modelo da galeria.',
            position: 0,
            published: true,
            durationMin: 2,
            contentMd:
              '## Galeria de modelos\n\n1. Abra **Modelos** no menu.\n2. Filtre por tag ou use a busca.\n3. Clique em **Usar modelo** para criar uma cópia na sua conta.\n\n> Os modelos prontos são mantidos pela equipe Weave; a cópia é sua e pode ser editada à vontade.',
          },
          {
            title: 'Edite e ajuste o estilo',
            summary: 'Use o editor visual e o painel de propriedades.',
            position: 1,
            published: true,
            durationMin: 4,
            contentMd:
              '## Editor visual\n\n- Arraste elementos da barra lateral para a folha.\n- Selecione um item para ajustar **Conteúdo** e **Estilo** no painel à direita.\n- Use `{fonte.campo}` para inserir dados do relatório.\n\nSalve com **Ctrl+S**.',
          },
          {
            title: 'Pré-visualize com dados fictícios',
            summary: 'Cadastre seus dados de exemplo e confira o resultado.',
            position: 2,
            published: true,
            durationMin: 3,
            contentMd:
              '## Dados de exemplo\n\nNa página do modelo, abra **Dados de exemplo** e crie um conjunto de dados em tabela.\n\nDepois clique em **Testar**.',
          },
        ],
      },
    },
  })
}

const main = async () => {
  await ensureSystemTags()
  if (REPLACE) await removeSystemTemplates()
  await seedSystemTemplates()
  await seedTraining()
}

main().finally(() => prisma.$disconnect())
