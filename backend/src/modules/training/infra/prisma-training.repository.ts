import { Prisma } from '@prisma/client'
import { prisma } from '../../../shared/infra/prisma'
import type { LessonInput, LessonView, TrackInput, TrackView, TrainingRepository } from '../domain/ports'

const lessonSelect = {
  id: true, trackId: true, title: true, summary: true, contentMd: true,
  videoUrl: true, durationMin: true, position: true, published: true,
} as const

const trackSelect = (onlyPublished: boolean) =>
  ({
    id: true, title: true, description: true, position: true, published: true,
    lessons: {
      where: onlyPublished ? { published: true } : undefined,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: lessonSelect,
    },
  }) satisfies Prisma.TrainingTrackSelect

const isNotFound = (err: unknown) => err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2025' || err.code === 'P2003')

export class PrismaTrainingRepository implements TrainingRepository {
  listTracks(onlyPublished: boolean): Promise<TrackView[]> {
    return prisma.trainingTrack.findMany({
      where: onlyPublished ? { published: true } : undefined,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: trackSelect(onlyPublished),
    })
  }

  async findLesson(lessonId: string) {
    const row = await prisma.trainingLesson.findUnique({ where: { id: lessonId }, select: { ...lessonSelect, track: { select: { published: true } } } })
    if (!row) return null
    const { track, ...lesson } = row
    return { ...lesson, trackPublished: track.published }
  }

  async completedLessonIds(userId: string) {
    const rows = await prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true } })
    return rows.map((r) => r.lessonId)
  }

  async setCompleted(userId: string, lessonId: string, completed: boolean) {
    if (completed) {
      await prisma.lessonProgress.upsert({ where: { userId_lessonId: { userId, lessonId } }, create: { userId, lessonId }, update: {} })
    } else {
      await prisma.lessonProgress.deleteMany({ where: { userId, lessonId } })
    }
  }

  createTrack(data: { title: string } & TrackInput) {
    return prisma.trainingTrack.create({ data, select: trackSelect(false) })
  }

  async updateTrack(trackId: string, data: TrackInput) {
    try {
      return await prisma.trainingTrack.update({ where: { id: trackId }, data, select: trackSelect(false) })
    } catch (err) {
      if (isNotFound(err)) return null
      throw err
    }
  }

  async deleteTrack(trackId: string) {
    return (await prisma.trainingTrack.deleteMany({ where: { id: trackId } })).count > 0
  }

  async createLesson(trackId: string, data: { title: string } & LessonInput): Promise<LessonView | null> {
    try {
      return await prisma.trainingLesson.create({ data: { ...data, trackId }, select: lessonSelect })
    } catch (err) {
      if (isNotFound(err)) return null
      throw err
    }
  }

  async updateLesson(lessonId: string, data: LessonInput) {
    try {
      return await prisma.trainingLesson.update({ where: { id: lessonId }, data, select: lessonSelect })
    } catch (err) {
      if (isNotFound(err)) return null
      throw err
    }
  }

  async deleteLesson(lessonId: string) {
    return (await prisma.trainingLesson.deleteMany({ where: { id: lessonId } })).count > 0
  }
}
