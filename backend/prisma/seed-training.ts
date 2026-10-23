import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Trilhas de treinamento escritas: os guias de `docs/treinamento/*.md` viram aulas (uma por seção `##`).
 * O texto dos arquivos é a fonte única; este script apenas o copia para o banco e pode ser repetido.
 *
 *   npm run seed:training
 */
const prisma = new PrismaClient()
const DOCS_DIR = path.resolve(__dirname, '../../docs/treinamento')

interface TrackSpec {
  file: string
  title: string
  description: string
  position: number
}

const TRACKS: TrackSpec[] = [
  { file: '01-elementos-do-weave.md', title: 'Guia dos elementos do editor', description: 'O que cada bloco e elemento faz, e como configurar.', position: 1 },
  { file: '02-montando-o-instrumento-de-protesto.md', title: 'Montando um Instrumento de Protesto do zero', description: 'Passo a passo para criar o documento completo, com dados de exemplo.', position: 2 },
]

interface Section {
  title: string
  body: string
}

/** Divide o markdown em seções por `## `; o que vem antes da primeira vira "Visão geral" (sem o título `#`). */
const splitSections = (markdown: string): Section[] => {
  const withoutH1 = markdown.replace(/^# .*\n+/, '')
  const parts = withoutH1.split(/^## /m)
  const sections: Section[] = []
  const intro = parts.shift()?.trim()
  if (intro) sections.push({ title: 'Visão geral', body: intro })
  for (const part of parts) {
    const [heading, ...rest] = part.split('\n')
    sections.push({ title: heading.trim(), body: rest.join('\n').replace(/^\n+|\n+---\s*$/g, '').replace(/\n---\s*$/, '').trim() })
  }
  return sections.filter((s) => s.body.length > 0)
}

const minutesOf = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 180))

const syncTrack = async (spec: TrackSpec) => {
  const markdown = readFileSync(path.join(DOCS_DIR, spec.file), 'utf8')
  const sections = splitSections(markdown)
  const existing = await prisma.trainingTrack.findFirst({ where: { title: spec.title } })
  const track = existing
    ? await prisma.trainingTrack.update({ where: { id: existing.id }, data: { description: spec.description, position: spec.position, published: true } })
    : await prisma.trainingTrack.create({ data: { title: spec.title, description: spec.description, position: spec.position, published: true } })

  for (const [index, section] of sections.entries()) {
    const data = { title: section.title, contentMd: section.body, position: index, published: true, durationMin: minutesOf(section.body) }
    const lesson = await prisma.trainingLesson.findFirst({ where: { trackId: track.id, title: section.title } })
    if (lesson) await prisma.trainingLesson.update({ where: { id: lesson.id }, data })
    else await prisma.trainingLesson.create({ data: { ...data, trackId: track.id } })
  }
  // aulas que saíram do arquivo deixam de aparecer (não são apagadas: podem ter progresso de alunos)
  await prisma.trainingLesson.updateMany({ where: { trackId: track.id, title: { notIn: sections.map((s) => s.title) } }, data: { published: false } })
  console.log(`${spec.title}: ${sections.length} aulas`)
}

/** A aula de "Primeiros passos" citava a galeria antiga; agora são Meus modelos e Biblioteca. */
const refreshFirstSteps = async () => {
  await prisma.trainingLesson.updateMany({
    where: { title: 'Escolha um modelo pronto' },
    data: {
      summary: 'Encontre um modelo na Biblioteca e crie a sua cópia.',
      contentMd:
        '## Biblioteca de modelos\n\n1. Abra **Biblioteca** no menu.\n2. Filtre por tag ou use a busca e clique num modelo para ver a **pré-visualização** com dados de exemplo.\n3. Clique em **Usar este modelo** para criar uma cópia na sua conta.\n\n> A cópia aparece em **Meus modelos** e é sua: pode editar à vontade. Os modelos da Biblioteca são mantidos pela equipe Weave e pela comunidade.',
    },
  })
}

const main = async () => {
  for (const spec of TRACKS) await syncTrack(spec)
  await refreshFirstSteps()
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
