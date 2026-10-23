'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { ApiError } from '@/shared/lib/api'
import { acceptSchema, type AcceptFormValues } from '../schemas/members.schemas'
import { membersService } from '../services/members.service'
import type { InvitationPreview } from '../types'

export const useAcceptInvitationHook = (token: string) => {
  const router = useRouter()
  const { executeStartSession, status } = useAuth()
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<AcceptFormValues>({ resolver: zodResolver(acceptSchema), defaultValues: { name: '', password: '' } })

  const executeLoadPreview = useCallback(async () => {
    try {
      setPreview(await membersService.previewInvitation(token))
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Convite inválido ou expirado')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const handleAccept = async (body: { name?: string; password?: string }) => {
    setErrorMessage(null)
    try {
      const result = await membersService.acceptInvitation(token, body)
      if (result.accessToken) await executeStartSession(result.accessToken, result.accountId)
      router.replace('/equipe')
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível aceitar o convite')
    }
  }

  const handleSubmit = form.handleSubmit((values) => handleAccept(values))

  return { form, preview, isLoading, errorMessage, isAuthenticated: status === 'authenticated', executeLoadPreview, handleAccept, handleSubmit }
}
