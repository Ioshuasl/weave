'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api'
import { templatesService } from '../services/templates.service'
import type { MockData, MockDataset } from '../types'

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.')

export const useMockDatasetsHook = (templateId: string) => {
  const [datasets, setDatasets] = useState<MockDataset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      setDatasets(await templatesService.listDatasets(templateId))
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(messageOf(err))
    } finally {
      setIsLoading(false)
    }
  }, [templateId])

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

  const handleSave = (body: { name: string; data: MockData }, datasetId?: string) =>
    handleAction(() =>
      datasetId ? templatesService.updateDataset(templateId, datasetId, body) : templatesService.createDataset(templateId, body),
    )
  const handleSetDefault = (datasetId: string) => handleAction(() => templatesService.updateDataset(templateId, datasetId, { isDefault: true }))
  const handleDelete = (datasetId: string) => handleAction(() => templatesService.deleteDataset(templateId, datasetId))

  return { datasets, isLoading, errorMessage, executeLoad, handleSave, handleSetDefault, handleDelete }
}
