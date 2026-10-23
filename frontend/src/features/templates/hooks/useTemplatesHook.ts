'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api'
import type { TemplateFormValues } from '../schemas/templates.schemas'
import { templatesService } from '../services/templates.service'
import type { TemplateGroup, TemplateSummary } from '../types'

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.')

export type TemplatesScope = 'mine' | 'library'

export const useTemplatesHook = (scope: TemplatesScope) => {
  const router = useRouter()
  const [items, setItems] = useState<TemplateSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

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

  /**
   * Galeria sem repetição: modelos prontos ficam como estão; cópias do mesmo modelo (mesma origem) viram UMA entrada
   * — a mais recente — com as demais em `copies` (nada é apagado).
   */
  const groups = useMemo<TemplateGroup[]>(() => {
    if (scope === 'library') return items.filter((t) => t.isSystem).map((template) => ({ template, copies: [] }))
    const byOrigin = new Map<string, TemplateSummary[]>()
    for (const t of items.filter((x) => !x.isSystem)) {
      const key = t.originId ?? t.id
      byOrigin.set(key, [...(byOrigin.get(key) ?? []), t])
    }
    const own = [...byOrigin.values()].map((list) => {
      const [latest, ...rest] = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      return { template: latest!, copies: rest }
    })
    return own.sort((a, b) => a.template.name.localeCompare(b.template.name, 'pt-BR'))
  }, [items, scope])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return groups.filter(
      ({ template: t }) =>
        (tagFilter === 'ALL' || t.tags.some((tag) => tag.id === tagFilter)) &&
        (!term || t.name.toLowerCase().includes(term) || (t.description ?? '').toLowerCase().includes(term) || t.tags.some((tag) => tag.name.toLowerCase().includes(term))),
    )
  }, [groups, tagFilter, search])

  /** tags em uso nos modelos visíveis, com a contagem (para a barra lateral de filtro) */
  const tagOptions = useMemo(() => {
    const byId = new Map<string, { tag: TemplateSummary['tags'][number]; count: number }>()
    for (const { template: t } of groups) for (const tag of t.tags) byId.set(tag.id, { tag, count: (byId.get(tag.id)?.count ?? 0) + 1 })
    return [...byId.values()].sort((a, b) => a.tag.name.localeCompare(b.tag.name, 'pt-BR'))
  }, [groups])

  const handleUse = async (id: string) => {
    try {
      const copy = await templatesService.duplicate(id)
      router.push(`/modelos/${copy.id}`)
    } catch (err) {
      setErrorMessage(messageOf(err))
    }
  }

  const handleCreate = async (values: TemplateFormValues) => {
    try {
      const created = await templatesService.create(values)
      router.push(`/modelos/${created.id}`)
      return true
    } catch (err) {
      setErrorMessage(messageOf(err))
      return false
    }
  }

  const handlePreviewReady = useCallback((id: string, previewUrl: string) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, previewUrl } : t)))
  }, [])

  const handleArchive = async (id: string) => {
    try {
      await templatesService.archive(id)
      setItems((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setErrorMessage(messageOf(err))
    }
  }

  return { filtered, tagOptions, total: groups.length, isLoading, errorMessage, tagFilter, search, setTagFilter, setSearch, executeLoad, handlePreviewReady, handleUse, handleCreate, handleArchive }
}
