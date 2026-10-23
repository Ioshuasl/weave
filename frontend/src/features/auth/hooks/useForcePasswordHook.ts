'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { passwordSchema, type PasswordFormValues } from '@/features/settings/schemas/settings.schemas'
import { settingsService } from '@/features/settings/services/settings.service'
import { ApiError, setAccessToken } from '@/shared/lib/api'
import { useAuth } from '../components/AuthProvider'

/** Troca obrigatória da senha provisória no primeiro acesso. */
export const useForcePasswordHook = () => {
  const { executeReloadProfile } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)
    try {
      const { accessToken } = await settingsService.changePassword(values)
      setAccessToken(accessToken)
      // o perfil volta com mustChangePassword = false e o app é liberado
      await executeReloadProfile()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'WRONG_PASSWORD') form.setError('currentPassword', { message: 'A senha provisória está incorreta.' })
      else setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível definir a senha. Tente novamente.')
    }
  })

  return { form, errorMessage, handleSubmit }
}
