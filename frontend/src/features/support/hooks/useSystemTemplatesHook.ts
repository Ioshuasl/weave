'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import type { TemplateFormValues } from '@/features/templates/schemas/templates.schemas'
import { templatesService } from '@/features/templates/services/templates.service'
import type { TemplateSummary } from '@/features/templates/types'
import { ApiError } from '@/shared/lib/api'

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.')

export const useSystemTemplatesHook = () => {
  const router = useRouter()
  const [items, setItems] = useState<TemplateSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      setItems(await templatesService.list())
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(messageOf(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCreate = async (values: TemplateFormValues) => {
    try {
      const created = await templatesService.createSystem(values)
      router.push(`/editor/${created.id}`)
      return true
    } catch (err) {
      setErrorMessage(messageOf(err))
      return false
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const published = await templatesService.publishAsSystem(id)
      setNotice(`"${published.name}" foi publicado como modelo pronto.`)
      await executeLoad()
    } catch (err) {
      setErrorMessage(messageOf(err))
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      await templatesService.archive(id)
      await executeLoad()
    } catch (err) {
      setErrorMessage(messageOf(err))
    }
  }

  return {
    system: items.filter((t) => t.isSystem),
    own: items.filter((t) => !t.isSystem),
    isLoading, errorMessage, notice, executeLoad, handleCreate, handlePublish, handleUnpublish,
  }
}
