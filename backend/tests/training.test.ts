import { describe, expect, it } from 'vitest'
import { GetLessonUseCase, ListTrainingUseCase } from '../src/modules/training/application/training.use-cases'
import type { LessonView, TrackView, TrainingRepository } from '../src/modules/training/domain/ports'
import { makeRequireSupport } from '../src/shared/http/require-support'

const lesson = (id: string, published: boolean): LessonView => ({
  id, trackId: 't1', title: id, summary: null, contentMd: 'segredo', videoUrl: null, durationMin: null, position: 0, published,
})
const tracks: TrackView[] = [{ id: 't1', title: 'T', description: null, position: 0, published: true, lessons: [lesson('l1', true)] }]
const repo = {
  listTracks: async () => tracks,
  completedLessonIds: async () => ['l1'],
  findLesson: async (id: string) => (id === 'l1' ? { ...lesson('l1', true), trackPublished: true } : id === 'l2' ? { ...lesson('l2', false), trackPublished: true } : null),
} as unknown as TrainingRepository

describe('training', () => {
  it('lista sem o conteúdo das aulas e com o progresso do usuário', async () => {
    const r = await new ListTrainingUseCase(repo).execute({ userId: 'u' })
    expect(r.completedLessonIds).toEqual(['l1'])
    expect(r.tracks[0]!.lessons[0]).not.toHaveProperty('contentMd')
  })

  it('aula rascunho ou inexistente não é visível ao usuário', async () => {
    const uc = new GetLessonUseCase(repo)
    await expect(uc.execute({ userId: 'u', lessonId: 'l2' })).rejects.toThrow(/não encontrada/)
    await expect(uc.execute({ userId: 'u', lessonId: 'zzz' })).rejects.toThrow(/não encontrada/)
    expect(await uc.execute({ userId: 'u', lessonId: 'l1' })).toMatchObject({ completed: true, contentMd: 'segredo' })
  })
})

describe('requireSupport', () => {
  const run = async (isSupport: boolean) => {
    let err: unknown
    await makeRequireSupport(async () => isSupport)({ auth: { userId: 'u' } } as never, {} as never, (e?: unknown) => { err = e })
    return err
  }
  it('bloqueia quem não é suporte e libera suporte', async () => {
    expect(await run(false)).toMatchObject({ status: 403 })
    expect(await run(true)).toBeUndefined()
  })
})
