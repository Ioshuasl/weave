'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { consumeNext } from '@/shared/actions/postLoginRedirect'
import { ApiError } from '@/shared/lib/api'
import { useAuth } from '../components/AuthProvider'
import { loginSchema, registerSchema, type LoginFormValues, type RegisterFormValues } from '../schemas/auth.schemas'
import { authService } from '../services/auth.service'

export const useLoginFormHook = () => {
  const router = useRouter()
  const { executeStartSession } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)
    try {
      const { accessToken } = await authService.login(values)
      await executeStartSession(accessToken)
      router.replace(consumeNext() ?? '/')
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.')
    }
  })

  return { form, errorMessage, handleSubmit }
}

export const useRegisterFormHook = () => {
  const router = useRouter()
  const { executeStartSession } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: 'PERSONAL', name: '', accountName: '', document: '', segment: '', email: '', password: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)
    try {
      const { accessToken, accountId } = await authService.register(values)
      await executeStartSession(accessToken, accountId)
      router.replace(consumeNext() ?? '/')
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.')
    }
  })

  return { form, errorMessage, handleSubmit }
}
