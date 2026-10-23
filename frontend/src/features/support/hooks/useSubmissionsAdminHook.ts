'use client'

import { useCallback, useState } from 'react'
import { sharingService } from '@/features/sharing/services/sharing.service'
import type { Submission } from '@/features/sharing/types'
import { ApiError } from '@/shared/lib/api'

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.')

export const useSubmissionsAdminHook = () => {
  const [items, setItems] = useState<Submission[]>([])
  const [status, setStatus] = useState<'PENDING' | 'ALL'>('PENDING')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const executeLoad = useCallback(async (filter: 'PENDING' | 'ALL' = 'PENDING') => {
    setIsLoading(true)
    try {
      setItems(await sharingService.listSubmissions(filter === 'PENDING' ? 'PENDING' : undefined))
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(messageOf(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFilter = (filter: 'PENDING' | 'ALL') => {
    setStatus(filter)
    executeLoad(filter)
  }

  const handleApprove = async (id: string, body: { tagIds: string[]; name?: string }) => {
    try {
      await sharingService.approve(id, body)
      setNotice('Modelo publicado na Biblioteca.')
      await executeLoad(status)
      return true
    } catch (err) {
      setErrorMessage(messageOf(err))
      return false
    }
  }

  const handleReject = async (id: string, note: string) => {
    try {
      await sharingService.reject(id, note)
      setNotice('Pedido recusado. O autor verá o motivo.')
      await executeLoad(status)
      return true
    } catch (err) {
      setErrorMessage(messageOf(err))
      return false
    }
  }

  return { items, status, isLoading, errorMessage, notice, executeLoad, handleFilter, handleApprove, handleReject }
}
