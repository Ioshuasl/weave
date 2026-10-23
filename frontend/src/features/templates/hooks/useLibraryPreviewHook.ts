'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api'
import { templatesService } from '../services/templates.service'
import type { MockDataset, TemplateDetail } from '../types'

/** Carrega o modelo da biblioteca e seus conjuntos de dados de exemplo para a pré-visualização ampla. */
export const useLibraryPreviewHook = (templateId: string) => {
  const [template, setTemplate] = useState<TemplateDetail | null>(null)
  const [datasets, setDatasets] = useState<MockDataset[]>([])
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      const [detail, list] = await Promise.all([templatesService.get(templateId), templatesService.listDatasets(templateId)])
      setTemplate(detail)
      setDatasets(list)
      setDatasetId((list.find((d) => d.isDefault) ?? list[0])?.id ?? null)
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível abrir o modelo.')
    } finally {
      setIsLoading(false)
    }
  }, [templateId])

  const dataset = datasets.find((d) => d.id === datasetId) ?? null

  return { template, datasets, dataset, isLoading, errorMessage, executeLoad, handleSelectDataset: setDatasetId }
}
