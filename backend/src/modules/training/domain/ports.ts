export interface LessonView {
  id: string
  trackId: string
  title: string
  summary: string | null
  contentMd: string
  videoUrl: string | null
  durationMin: number | null
  position: number
  published: boolean
}

export interface TrackView {
  id: string
  title: string
  description: string | null
  position: number
  published: boolean
  lessons: LessonView[]
}

export interface TrackInput {
  title?: string
  description?: string | null
  position?: number
  published?: boolean
}

export interface LessonInput {
  title?: string
  summary?: string | null
  contentMd?: string
  videoUrl?: string | null
  durationMin?: number | null
  position?: number
  published?: boolean
}

export interface TrainingRepository {
  /** `onlyPublished`: usuários comuns só veem trilhas e aulas publicadas. */
  listTracks(onlyPublished: boolean): Promise<TrackView[]>
  findLesson(lessonId: string): Promise<(LessonView & { trackPublished: boolean }) | null>
  completedLessonIds(userId: string): Promise<string[]>
  setCompleted(userId: string, lessonId: string, completed: boolean): Promise<void>
  createTrack(data: Required<Pick<TrackInput, 'title'>> & TrackInput): Promise<TrackView>
  updateTrack(trackId: string, data: TrackInput): Promise<TrackView | null>
  deleteTrack(trackId: string): Promise<boolean>
  createLesson(trackId: string, data: Required<Pick<LessonInput, 'title'>> & LessonInput): Promise<LessonView | null>
  updateLesson(lessonId: string, data: LessonInput): Promise<LessonView | null>
  deleteLesson(lessonId: string): Promise<boolean>
}
