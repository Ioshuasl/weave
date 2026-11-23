'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, ChevronsUpDown, LogOut, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { fadeScale } from '@/shared/lib/motion'
import { Avatar } from '@/shared/ui/Avatar'

const itemClass = 'flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-foreground transition-colors hover:bg-surface-secondary'

/** Cartão da pessoa no rodapé da sidebar; ao clicar abre o menu (Trocar de conta, Configurações, Sair) para cima. */
export const UserMenu = ({ onOpenSettings, onOpenAccountSwitch }: { onOpenSettings: () => void; onOpenAccountSwitch: () => void }) => {
  const { user, activeMembership, executeSignOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  if (!user) return null
  const run = (fn: () => void) => () => {
    setIsOpen(false)
    fn()
  }

  return (
    <div ref={rootRef} className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            variants={fadeScale}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ transformOrigin: 'bottom left' }}
            className="absolute inset-x-0 bottom-full z-50 mb-2 rounded-lg border border-border bg-surface p-1 shadow-md"
          >
            {user.memberships.length > 1 && (
              <button type="button" role="menuitem" onClick={run(onOpenAccountSwitch)} className={itemClass}>
                <ArrowLeftRight className="size-4" aria-hidden />Trocar de conta
              </button>
            )}
            <button type="button" role="menuitem" onClick={run(onOpenSettings)} className={itemClass}>
              <Settings className="size-4" aria-hidden />Configurações
            </button>
            <button type="button" role="menuitem" onClick={run(executeSignOut)} className={itemClass}>
              <LogOut className="size-4" aria-hidden />Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Menu da conta de ${user.name}`}
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface p-2 text-left transition-colors hover:bg-surface-secondary"
      >
        <Avatar avatarUrl={user.avatarUrl} className="size-8 shrink-0 border-0 bg-transparent" iconClassName="size-5" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium leading-tight">{user.name}</span>
          <span className="block truncate text-xs leading-tight text-fg-muted">{activeMembership?.accountName ?? user.email}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-fg-muted" aria-hidden />
      </button>
    </div>
  )
}
