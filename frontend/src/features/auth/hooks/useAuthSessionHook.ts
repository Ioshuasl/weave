'use client'

import { useCallback, useState } from 'react'
import { refreshAccessToken, setAccessToken, setActiveAccountId } from '@/shared/lib/api'
import { authService } from '../services/auth.service'
import type { Membership, UserProfile } from '../types'

const STORAGE_KEY = 'weave.accountId'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

const readStoredAccount = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export const useAuthSessionHook = () => {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)

  const handleSelectAccount = useCallback((id: string) => {
    setActiveAccountId(id)
    setAccountId(id)
    try {
      window.localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
  }, [])

  const handleLoadProfile = useCallback(async () => {
    const profile = await authService.me()
    const stored = readStoredAccount()
    const chosen = profile.memberships.find((m) => m.accountId === stored) ?? profile.memberships[0]
    setUser(profile)
    setStatus('authenticated')
    if (chosen) handleSelectAccount(chosen.accountId)
  }, [handleSelectAccount])

  const executeBootstrap = useCallback(async () => {
    try {
      if (!(await refreshAccessToken())) {
        setStatus('anonymous')
        return
      }
      await handleLoadProfile()
    } catch {
      setAccessToken(null)
      setStatus('anonymous')
    }
  }, [handleLoadProfile])

  const executeStartSession = useCallback(
    async (accessToken: string, preferredAccountId?: string) => {
      setAccessToken(accessToken)
      if (preferredAccountId) handleSelectAccount(preferredAccountId)
      await handleLoadProfile()
      if (preferredAccountId) handleSelectAccount(preferredAccountId)
    },
    [handleLoadProfile, handleSelectAccount],
  )

  const executeSignOut = useCallback(async () => {
    await authService.logout()
    setAccessToken(null)
    setActiveAccountId(null)
    setUser(null)
    setAccountId(null)
    setStatus('anonymous')
  }, [])

  /** Recarrega o perfil após editar dados/foto nas configurações. */
  const executeReloadProfile = useCallback(async () => {
    setUser(await authService.me())
  }, [])

  const activeMembership: Membership | undefined = user?.memberships.find((m) => m.accountId === accountId)

  return { status, user, accountId, activeMembership, executeBootstrap, executeStartSession, executeSignOut, executeReloadProfile, handleSelectAccount }
}
