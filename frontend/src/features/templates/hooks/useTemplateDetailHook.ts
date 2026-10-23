'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { assistantService } from '@/features/assistant/services/assistant.service'
import type { AssistantInteraction } from '@/features/assistant/types'
import { ApiError } from '@/shared/lib/api'
import { templatesService } from '../services/templates.service'
import type { TemplateDetail, VersionDiff, VersionSummary } from '../types'

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.')

export const useTemplateDetailHook = (id: string) => {
  const router = useRouter()
  const [template, setTemplate] = useState<TemplateDetail | null>(null)
  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [interactions, setInteractions] = useState<AssistantInteraction[]>([])
  const [diffs, setDiffs] = useState<Record<number, VersionDiff>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      const [detail, history, chats] = await Promise.all([
        templatesService.get(id),
        templatesService.versions(id),
        // sem permissão/assistente desligado: a linha do tempo segue só com as versões
        assistantService.history(id).catch(() => [] as AssistantInteraction[]),
      ])
      setTemplate(detail)
      setVersions(history)
      setInteractions(chats)
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(messageOf(err))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  /** Salva um campo do modelo no lugar (nome, descrição ou tags). */
  const handlePatch = async (body: { name?: string; description?: string | null; tagIds?: string[] }) => {
    try {
      const updated = await templatesService.patch(id, body)
      setTemplate((prev) => (prev ? { ...prev, name: updated.name, description: updated.description, tags: updated.tags, updatedAt: updated.updatedAt } : updated))
      setErrorMessage(null)
      return true
    } catch (err) {
      setErrorMessage(messageOf(err))
      return false
    }
  }

  const handleRestore = async (number: number) => {
    try {
      setTemplate(await templatesService.restore(id, number))
      setVersions(await templatesService.versions(id))
    } catch (err) {
      setErrorMessage(messageOf(err))
    }
  }

  const handleLoadDiff = async (number: number) => {
    if (diffs[number]) return
    try {
      const diff = await templatesService.diff(id, number)
      setDiffs((prev) => ({ ...prev, [number]: diff }))
    } catch (err) {
      setErrorMessage(messageOf(err))
    }
  }

  /** Modelo pronto → cria a cópia na conta e abre. */
  const handleUse = async () => {
    try {
      const copy = await templatesService.duplicate(id)
      router.push(`/modelos/${copy.id}`)
    } catch (err) {
      setErrorMessage(messageOf(err))
    }
  }

  const handlePreviewReady = useCallback((previewUrl: string) => {
    setTemplate((prev) => (prev ? { ...prev, previewUrl } : prev))
  }, [])

  return { template, versions, interactions, diffs, isLoading, errorMessage, executeLoad, handlePatch, handleUse, handleRestore, handleLoadDiff, handlePreviewReady }
}
