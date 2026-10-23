'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api'
import { trainingService } from '../services/training.service'
import type { LessonDetail } from '../types'

export const useLessonHook = (lessonId: string) => {
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      setLesson(await trainingService.lesson(lessonId))
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível abrir a aula.')
    } finally {
      setIsLoading(false)
    }
  }, [lessonId])

  const handleToggleCompleted = async () => {
    if (!lesson) return
    try {
      await trainingService.setCompleted(lesson.id, !lesson.completed)
      setLesson({ ...lesson, completed: !lesson.completed })
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível atualizar o progresso.')
    }
  }

  return { lesson, isLoading, errorMessage, executeLoad, handleToggleCompleted }
}
