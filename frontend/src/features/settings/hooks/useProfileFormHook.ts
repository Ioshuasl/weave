'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { prepareAvatarImage } from '@/shared/actions/prepareAvatarImage'
import { ApiError } from '@/shared/lib/api'
import { profileSchema, type ProfileFormValues } from '../schemas/settings.schemas'
import { settingsService } from '../services/settings.service'

export const useProfileFormHook = () => {
  const { user, executeReloadProfile } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const defaultValues: ProfileFormValues = {
    name: user?.name ?? '',
    username: user?.username ?? '',
    jobRole: user?.jobRole ?? '',
    timezone: user?.timezone ?? 'America/Sao_Paulo',
    website: user?.website ?? '',
    bio: user?.bio ?? '',
  }
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues })

  const handleSubmit = form.handleSubmit(async (values) => {
    setMessage(null)
    try {
      await settingsService.updateProfile(values)
      await executeReloadProfile()
      form.reset(values)
      setMessage({ tone: 'success', text: 'Perfil atualizado.' })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'USERNAME_TAKEN') form.setError('username', { message: err.message })
      else setMessage({ tone: 'error', text: err instanceof ApiError ? err.message : 'Não foi possível salvar. Tente novamente.' })
    }
  })

  const handleCancel = () => {
    form.reset(defaultValues)
    setMessage(null)
  }

  const handlePickPhoto = () => fileInput.current?.click()

  const handlePhotoSelected = async (file: File | undefined) => {
    if (!file) return
    setMessage(null)
    setIsUploading(true)
    try {
      await settingsService.uploadAvatar(await prepareAvatarImage(file))
      await executeReloadProfile()
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Não foi possível enviar a foto.' })
    } finally {
      setIsUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    setMessage(null)
    try {
      await settingsService.removeAvatar()
      await executeReloadProfile()
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof ApiError ? err.message : 'Não foi possível remover a foto.' })
    }
  }

  return { form, fileInput, message, isUploading, handleSubmit, handleCancel, handlePickPhoto, handlePhotoSelected, handleRemovePhoto }
}
