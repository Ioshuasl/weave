export interface Lesson {
  id: string
  trackId: string
  title: string
  summary: string | null
  contentMd?: string
  videoUrl: string | null
  durationMin: number | null
  position: number
  published: boolean
}

export interface Track {
  id: string
  title: string
  description: string | null
  position: number
  published: boolean
  lessons: Lesson[]
}

export interface TrainingOverview {
  tracks: Track[]
  completedLessonIds: string[]
}

export interface LessonDetail extends Lesson {
  contentMd: string
  completed: boolean
}
