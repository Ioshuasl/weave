import { api } from '@/shared/lib/api'
import type { Lesson, LessonDetail, Track, TrainingOverview } from '../types'

export type TrackInput = { title?: string; description?: string | null; position?: number; published?: boolean }
export type LessonInput = {
  title?: string
  summary?: string | null
  contentMd?: string
  videoUrl?: string | null
  durationMin?: number | null
  position?: number
  published?: boolean
}

export const trainingService = {
  overview: () => api<TrainingOverview>('/training'),
  lesson: (id: string) => api<LessonDetail>(`/training/lessons/${id}`),
  setCompleted: (id: string, completed: boolean) =>
    api(`/training/lessons/${id}/completed`, { method: completed ? 'PUT' : 'DELETE' }),
  // suporte
  adminList: () => api<Track[]>('/support/training'),
  createTrack: (body: TrackInput) => api<Track>('/support/training/tracks', { method: 'POST', body }),
  updateTrack: (id: string, body: TrackInput) => api<Track>(`/support/training/tracks/${id}`, { method: 'PATCH', body }),
  deleteTrack: (id: string) => api(`/support/training/tracks/${id}`, { method: 'DELETE' }),
  createLesson: (trackId: string, body: LessonInput) => api<Lesson>(`/support/training/tracks/${trackId}/lessons`, { method: 'POST', body }),
  updateLesson: (id: string, body: LessonInput) => api<Lesson>(`/support/training/lessons/${id}`, { method: 'PATCH', body }),
  deleteLesson: (id: string) => api(`/support/training/lessons/${id}`, { method: 'DELETE' }),
}
