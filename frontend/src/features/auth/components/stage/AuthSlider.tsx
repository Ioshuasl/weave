'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, FileText, Sparkles, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/shared/lib/cn'
import { LoginFormBody } from '../LoginForm'
import { RegisterFormBody } from '../RegisterForm'
import { useStaggerIn } from './useStaggerIn'

export type AuthMode = 'login' | 'register'

const BENEFITS = [
  { icon: FileText, text: 'Modelos prontos para começar na hora' },
  { icon: Wand2, text: 'Editor visual: clique, arraste e pronto' },
  { icon: Sparkles, text: 'Assistente de IA para ajustar por você' },
] as const

const COPY: Record<AuthMode, { title: string; text: string; cta: string; href: string }> = {
  login: { title: 'Novo por aqui?', text: 'Crie sua conta em menos de um minuto e comece com um modelo pronto.', cta: 'Criar conta', href: '/cadastro' },
  register: { title: 'Já tem uma conta?', text: 'Entre para continuar de onde parou — seus modelos estão esperando.', cta: 'Entrar', href: '/login' },
}

const SPRING = { type: 'spring', stiffness: 130, damping: 22, mass: 0.9 } as const

const FormHalf = ({ active, side, children }: { active: boolean; side: 'left' | 'right'; children: React.ReactNode }) => {
  const ref = useStaggerIn(active, 260)
  return (
    <motion.section
      ref={ref}
      aria-hidden={!active}
      inert={!active}
      initial={false}
      animate={{ opacity: active ? 1 : 0, x: active ? 0 : side === 'left' ? -28 : 28 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: active ? 0.2 : 0 }}
      className={cn('flex max-h-[inherit] items-center overflow-y-auto p-10', side === 'right' && 'col-start-2 row-start-1', side === 'left' && 'col-start-1 row-start-1')}
    >
      {children}
    </motion.section>
  )
}

/**
 * Desktop: dois formulários lado a lado e um painel azul de boas-vindas que desliza entre as metades.
 * O painel mostra sempre a ação oposta ("Novo por aqui? Criar conta" / "Já tem conta? Entrar").
 */
export const AuthSlider = ({ mode }: { mode: AuthMode }) => {
  const copy = COPY[mode]
  return (
    <div
      data-auth-panel
      className="pointer-events-auto relative grid max-h-[min(94dvh,820px)] min-h-[620px] w-full max-w-[1000px] grid-cols-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
    >
      <FormHalf active={mode === 'login'} side="left"><LoginFormBody showSwitchLink={false} /></FormHalf>
      <FormHalf active={mode === 'register'} side="right"><RegisterFormBody showSwitchLink={false} /></FormHalf>

      <motion.aside
        initial={false}
        animate={{ x: mode === 'login' ? '100%' : '0%' }}
        transition={SPRING}
        className="absolute inset-y-0 left-0 z-10 flex w-1/2 flex-col justify-center overflow-hidden bg-primary p-10 text-primary-fg"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10"
          >
            <h2 className="text-3xl font-semibold">{copy.title}</h2>
            <p className="mt-2 max-w-xs text-md text-primary-fg/85">{copy.text}</p>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-base">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-fg/15"><Icon className="size-4" aria-hidden /></span>
                  {text}
                </li>
              ))}
            </ul>
            <Link
              href={copy.href}
              className="group mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-surface px-4 text-sm font-medium text-primary transition-colors hover:bg-primary-subtle"
            >
              {copy.cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* folhas decorativas dentro do painel */}
        <div className="pointer-events-none absolute -bottom-10 -right-6 h-44 w-36 rotate-12 rounded-lg border border-primary-fg/20 bg-primary-fg/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-6 right-14 h-40 w-32 -rotate-6 rounded-lg border border-primary-fg/20 bg-primary-fg/10" aria-hidden />
      </motion.aside>
    </div>
  )
}
