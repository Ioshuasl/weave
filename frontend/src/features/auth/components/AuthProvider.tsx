'use client'

import { createContext, useContext, useEffect } from 'react'
import { useAuthSessionHook } from '../hooks/useAuthSessionHook'

type AuthContextValue = ReturnType<typeof useAuthSessionHook>

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const session = useAuthSessionHook()
  const { executeBootstrap } = session

  useEffect(() => {
    executeBootstrap()
  }, [executeBootstrap])

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}
