'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { rememberNext } from '@/shared/actions/postLoginRedirect'
import { ApiError } from '@/shared/lib/api'
import { sharingService } from '../services/sharing.service'
import type { SharedTemplate } from '../types'

export const useSharedTemplateHook = (token: string) => {
  const router = useRouter()
  const [template, setTemplate] = useState<SharedTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginRequired, setIsLoginRequired] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCopying, setIsCopying] = useState(false)

  const executeLoad = useCallback(async () => {
    try {
      setIsLoginRequired(false)
      setTemplate(await sharingService.getShared(token))
      setErrorMessage(null)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'LOGIN_REQUIRED') setIsLoginRequired(true)
      else setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível abrir este modelo.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  /** guarda o link para voltar depois de entrar ou criar a conta */
  const handleGoToAuth = (path: '/login' | '/cadastro') => {
    rememberNext(`/s/${token}`)
    router.push(path)
  }

  const handleUse = async () => {
    setIsCopying(true)
    try {
      const copy = await sharingService.copyShared(token)
      router.push(`/modelos/${copy.id}`)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível criar a cópia.')
      setIsCopying(false)
    }
  }

  return { template, isLoading, isLoginRequired, errorMessage, isCopying, executeLoad, handleGoToAuth, handleUse }
}
