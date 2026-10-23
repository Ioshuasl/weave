'use client'

import { useCallback, useState } from 'react'
import type { TagColorEnum } from '@/shared/enums/TagColorEnum'
import { ApiError } from '@/shared/lib/api'
import { tagsService } from '../services/tags.service'
import type { Tag } from '../types'

export const useTagsHook = () => {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      setTags(await tagsService.list())
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível carregar as tags.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /** Cria a tag; se o nome já existir no mesmo escopo, devolve a existente (como o Notion). */
  const handleCreate = async (name: string, system: boolean): Promise<Tag | null> => {
    try {
      const created = await tagsService.create({ name, system })
      setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
      return created
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const existing = tags.find((t) => t.system === system && t.name.toLowerCase() === name.toLowerCase())
        if (existing) return existing
      }
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível criar a tag.')
      return null
    }
  }

  const handleUpdate = async (id: string, body: { name?: string; color?: TagColorEnum }) => {
    try {
      const updated = await tagsService.update(id, body)
      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)))
      return true
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível atualizar a tag.')
      return false
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await tagsService.remove(id)
      setTags((prev) => prev.filter((t) => t.id !== id))
      return true
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível excluir a tag.')
      return false
    }
  }

  return { tags, isLoading, errorMessage, executeLoad, handleCreate, handleUpdate, handleDelete }
}
