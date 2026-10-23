'use client'

import { Building2, Check, User, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { AccountTypeLabel } from '@/shared/enums/AccountTypeEnum'
import { MemberRoleLabel } from '@/shared/enums/MemberRoleEnum'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

/** Escolha da conta ativa (só é aberto para quem pertence a 2+ contas). */
export const AccountSwitchDialog = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter()
  const { user, accountId, handleSelectAccount } = useAuth()
  const [selected, setSelected] = useState(accountId)

  const handleListenEscape = () => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }
  useEffect(handleListenEscape, [])

  const handleConfirm = () => {
    if (!selected || selected === accountId) return onClose()
    handleSelectAccount(selected)
    // telas abertas (ex.: um modelo) pertencem à conta anterior: volta para a página inicial
    router.push('/')
    onClose()
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="switch-title" className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 id="switch-title" className="text-md font-semibold">Trocar de conta</h2>
            <p className="text-sm text-fg-secondary">Escolha em qual conta você quer trabalhar agora.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>

        <div role="radiogroup" aria-label="Contas" className="flex flex-col gap-2 p-4">
          {user.memberships.map((m) => {
            const Icon = m.accountType === 'COMPANY' ? Building2 : User
            const isSelected = m.accountId === selected
            return (
              <button
                key={m.accountId}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(m.accountId)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                  isSelected ? 'border-primary-border bg-primary-subtle' : 'border-border hover:bg-surface-hover',
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-fg-secondary"><Icon className="size-4" aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium">{m.accountName}</span>
                  <span className="block text-xs text-fg-muted">{AccountTypeLabel[m.accountType]} · {MemberRoleLabel[m.role]}{m.accountId === accountId ? ' · conta atual' : ''}</span>
                </span>
                {isSelected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </button>
            )
          })}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-surface-secondary px-4 py-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!selected || selected === accountId}>Trocar de conta</Button>
        </footer>
      </div>
    </div>
  )
}
