'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { LoginFormBody } from '../LoginForm'
import { RegisterFormBody } from '../RegisterForm'
import { AnimatedHeight } from './AnimatedHeight'
import type { AuthMode } from './AuthSlider'
import { useStaggerIn } from './useStaggerIn'

const Swap = ({ mode }: { mode: AuthMode }) => {
  const ref = useStaggerIn(true, 120)
  return <div ref={ref}>{mode === 'login' ? <LoginFormBody /> : <RegisterFormBody />}</div>
}

/** Telas estreitas (e variante "tela única"): um cartão, o formulário troca com deslize + altura fluida. */
export const AuthSwap = ({ mode }: { mode: AuthMode }) => (
  <div data-auth-panel className="pointer-events-auto w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8">
    <AnimatedHeight>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === 'register' ? 32 : -32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === 'register' ? -32 : 32 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Swap mode={mode} />
        </motion.div>
      </AnimatePresence>
    </AnimatedHeight>
  </div>
)
