import { notFound } from '../../../shared/errors/app-error'
import type { LessonInput, TrackInput, TrainingRepository } from '../domain/ports'

/** Trilhas publicadas + o que o usuário já concluiu. */
export class ListTrainingUseCase {
  constructor(private readonly training: TrainingRepository) {}

  async execute(data: { userId: string }) {
    const [tracks, completed] = await Promise.all([this.training.listTracks(true), this.training.completedLessonIds(data.userId)])
    // a listagem leva só o resumo das aulas; o conteúdo vem no detalhe da aula
    return {
      tracks: tracks.map((t) => ({ ...t, lessons: t.lessons.map(({ contentMd: _contentMd, ...lesson }) => lesson) })),
      completedLessonIds: completed,
    }
  }
}

export class GetLessonUseCase {
  constructor(private readonly training: TrainingRepository) {}

  async execute(data: { userId: string; lessonId: string }) {
    const lesson = await this.training.findLesson(data.lessonId)
    if (!lesson || !lesson.published || !lesson.trackPublished) throw notFound('Aula não encontrada')
    const completed = (await this.training.completedLessonIds(data.userId)).includes(lesson.id)
    const { trackPublished: _trackPublished, ...view } = lesson
    return { ...view, completed }
  }
}

export class SetLessonCompletedUseCase {
  constructor(private readonly training: TrainingRepository) {}

  async execute(data: { userId: string; lessonId: string; completed: boolean }): Promise<void> {
    const lesson = await this.training.findLesson(data.lessonId)
    if (!lesson || !lesson.published || !lesson.trackPublished) throw notFound('Aula não encontrada')
    await this.training.setCompleted(data.userId, data.lessonId, data.completed)
  }
}

// ---- painel do suporte (acesso já restrito pelo middleware) ----

export class ListAllTrainingUseCase {
  constructor(private readonly training: TrainingRepository) {}

  execute() {
    return this.training.listTracks(false)
  }
}

export class CreateTrackUseCase {
  constructor(private readonly training: TrainingRepository) {}

  execute(data: { title: string } & TrackInput) {
    return this.training.createTrack(data)
  }
}

export class UpdateTrackUseCase {
  constructor(private readonly training: TrainingRepository) {}

  async execute(data: { trackId: string } & TrackInput) {
    const { trackId, ...input } = data
    const track = await this.training.updateTrack(trackId, input)
    if (!track) throw notFound('Trilha não encontrada')
    return track
  }
}

export class DeleteTrackUseCase {
  constructor(private readonly training: TrainingRepository) {}

  async execute(data: { trackId: string }): Promise<void> {
    if (!(await this.training.deleteTrack(data.trackId))) throw notFound('Trilha não encontrada')
  }
}

export class CreateLessonUseCase {
  constructor(private readonly training: TrainingRepository) {}

  async execute(data: { trackId: string; title: string } & LessonInput) {
    const { trackId, ...input } = data
    const lesson = await this.training.createLesson(trackId, input)
    if (!lesson) throw notFound('Trilha não encontrada')
    return lesson
  }
}

export class UpdateLessonUseCase {
  constructor(private readonly training: TrainingRepository) {}

  async execute(data: { lessonId: string } & LessonInput) {
    const { lessonId, ...input } = data
    const lesson = await this.training.updateLesson(lessonId, input)
    if (!lesson) throw notFound('Aula não encontrada')
    return lesson
  }
}

export class DeleteLessonUseCase {
  constructor(private readonly training: TrainingRepository) {}

  async execute(data: { lessonId: string }): Promise<void> {
    if (!(await this.training.deleteLesson(data.lessonId))) throw notFound('Aula não encontrada')
  }
}
