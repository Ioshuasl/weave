'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { setAccessToken } from '@/shared/lib/api'
import { ApiError } from '@/shared/lib/api'
import { passwordSchema, type PasswordFormValues } from '../schemas/settings.schemas'
import { settingsService, type ActiveSession } from '../services/settings.service'

export const useSecurityHook = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const executeLoadSessions = useCallback(async () => {
    try {
      setSessions(await settingsService.sessions())
    } catch {
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSubmit = form.handleSubmit(async (values) => {
    setMessage(null)
    try {
      const { accessToken } = await settingsService.changePassword(values)
      setAccessToken(accessToken)
      form.reset()
      setMessage({ tone: 'success', text: 'Senha alterada. Os outros dispositivos foram desconectados.' })
      await executeLoadSessions()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'WRONG_PASSWORD') form.setError('currentPassword', { message: err.message })
      else setMessage({ tone: 'error', text: err instanceof ApiError ? err.message : 'Não foi possível alterar a senha.' })
    }
  })

  const handleRevoke = async (id: string) => {
    try {
      await settingsService.revokeSession(id)
      await executeLoadSessions()
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof ApiError ? err.message : 'Não foi possível encerrar a sessão.' })
    }
  }

  return { form, sessions, isLoading, message, executeLoadSessions, handleSubmit, handleRevoke }
}
