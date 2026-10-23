'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api'
import { trainingService } from '../services/training.service'
import type { TrainingOverview } from '../types'

export const useTrainingHook = () => {
  const [data, setData] = useState<TrainingOverview>({ tracks: [], completedLessonIds: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      setData(await trainingService.overview())
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível carregar o treinamento.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { ...data, isLoading, errorMessage, executeLoad }
}
