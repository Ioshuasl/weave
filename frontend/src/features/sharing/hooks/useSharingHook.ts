'use client'

import { useCallback, useState } from 'react'
import type { AccountSegmentEnum } from '@/shared/enums/AccountSegmentEnum'
import type { ShareModeEnum } from '@/shared/enums/ShareModeEnum'
import { ApiError } from '@/shared/lib/api'
import { sharingService } from '../services/sharing.service'
import type { SharingState } from '../types'

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.')

/** Compartilhamento por link e pedido de publicação na biblioteca de um modelo. */
export const useSharingHook = (templateId: string) => {
  const [state, setState] = useState<SharingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      setState(await sharingService.get(templateId))
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(messageOf(err))
    } finally {
      setIsLoading(false)
    }
  }, [templateId])

  const handleSaveShare = async (mode: ShareModeEnum, allowCopy: boolean) => {
    try {
      const share = await sharingService.update(templateId, { mode, allowCopy })
      setState((prev) => (prev ? { ...prev, share } : prev))
      setErrorMessage(null)
      return true
    } catch (err) {
      setErrorMessage(messageOf(err))
      return false
    }
  }

  const handleSubmit = async (body: { description?: string | null; segment?: AccountSegmentEnum | null; note?: string | null }) => {
    try {
      const submission = await sharingService.submit(templateId, body)
      setState((prev) => (prev ? { ...prev, submission } : prev))
      setErrorMessage(null)
      return true
    } catch (err) {
      setErrorMessage(messageOf(err))
      return false
    }
  }

  const handleCancel = async () => {
    try {
      await sharingService.cancel(templateId)
      await executeLoad()
    } catch (err) {
      setErrorMessage(messageOf(err))
    }
  }

  return { state, isLoading, errorMessage, executeLoad, handleSaveShare, handleSubmit, handleCancel }
}
