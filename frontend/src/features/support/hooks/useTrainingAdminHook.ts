'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api'
import { trainingService, type LessonInput, type TrackInput } from '@/features/training/services/training.service'
import type { Track } from '@/features/training/types'

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.')

export const useTrainingAdminHook = () => {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      setTracks(await trainingService.adminList())
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(messageOf(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleAction = async (action: () => Promise<unknown>) => {
    try {
      await action()
      await executeLoad()
      return true
    } catch (err) {
      setErrorMessage(messageOf(err))
      return false
    }
  }

  return {
    tracks, isLoading, errorMessage, executeLoad,
    handleSaveTrack: (body: TrackInput, id?: string) => handleAction(() => (id ? trainingService.updateTrack(id, body) : trainingService.createTrack(body))),
    handleDeleteTrack: (id: string) => handleAction(() => trainingService.deleteTrack(id)),
    handleSaveLesson: (trackId: string, body: LessonInput, lessonId?: string) =>
      handleAction(() => (lessonId ? trainingService.updateLesson(lessonId, body) : trainingService.createLesson(trackId, body))),
    handleDeleteLesson: (id: string) => handleAction(() => trainingService.deleteLesson(id)),
    handleTogglePublished: (kind: 'track' | 'lesson', id: string, published: boolean) =>
      handleAction(() => (kind === 'track' ? trainingService.updateTrack(id, { published }) : trainingService.updateLesson(id, { published }))),
  }
}
