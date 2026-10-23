'use client'

import { MotionConfig } from 'framer-motion'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import { AuthBackdrop } from './AuthBackdrop'
import { AuthSlider, type AuthMode } from './AuthSlider'
import { AuthSwap } from './AuthSwap'

/**
 * Transição entre Entrar e Criar conta (teste A/B):
 * - 'slider': painel deslizante lado a lado (telas largas);
 * - 'swap': tela única com troca animada. Mude a constante para voltar à opção segura.
 */
export const AUTH_TRANSITION: 'slider' | 'swap' = 'slider'

/** Palco persistente (layout): o fundo nunca recarrega ao navegar entre /login, /cadastro e /convite. */
export const AuthStage = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isInvite = pathname.startsWith('/convite')
  const mode: AuthMode = pathname.startsWith('/cadastro') ? 'register' : 'login'

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-dvh overflow-hidden bg-background">
        <AuthBackdrop />
        {/* pointer-events-none: o mouse "atravessa" o palco e alcança as folhas; só o painel recebe cliques */}
        <div className="pointer-events-none relative z-10 flex min-h-dvh items-center justify-center p-4">
          {isDesktop === null ? null : isInvite ? (
            <div data-auth-panel className="pointer-events-auto w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8">{children}</div>
          ) : isDesktop && AUTH_TRANSITION === 'slider' ? (
            <AuthSlider mode={mode} />
          ) : (
            <AuthSwap mode={mode} />
          )}
        </div>
      </main>
    </MotionConfig>
  )
}
