'use client'

import { ArrowLeftRight, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { Avatar } from '@/shared/ui/Avatar'

/** Ícone da pessoa no cabeçalho; ao passar o mouse (ou focar/tocar) mostra Configurações e Sair. */
export const UserMenu = ({ onOpenSettings, onOpenAccountSwitch }: { onOpenSettings: () => void; onOpenAccountSwitch: () => void }) => {
  const { user, activeMembership, executeSignOut } = useAuth()
  if (!user) return null

  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-label={`Menu da conta de ${user.name}`}
        className="flex size-9 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-secondary group-hover:bg-surface-secondary"
      >
        <Avatar avatarUrl={user.avatarUrl} className="size-8 border-0 bg-transparent" iconClassName="size-5" />
      </button>
      {/* pt-2 mantém o hover contínuo entre o ícone e o menu */}
      <div className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div role="menu" className="w-56 rounded-lg border border-border bg-surface p-1 shadow-md">
          <div className="mb-1 border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-fg-muted">{user.email}</p>
            {activeMembership && <p className="mt-1 truncate text-xs text-fg-secondary">{activeMembership.accountName}</p>}
          </div>
          {/* só aparece para quem pertence a 2+ contas; abre um dialog para escolher */}
          {user.memberships.length > 1 && (
            <button type="button" role="menuitem" onClick={onOpenAccountSwitch} className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-foreground transition-colors hover:bg-surface-secondary">
              <ArrowLeftRight className="size-4" aria-hidden />Trocar de conta
            </button>
          )}
          <button type="button" role="menuitem" onClick={onOpenSettings} className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-foreground transition-colors hover:bg-surface-secondary">
            <Settings className="size-4" aria-hidden />Configurações
          </button>
          <button type="button" role="menuitem" onClick={executeSignOut} className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-foreground transition-colors hover:bg-surface-secondary">
            <LogOut className="size-4" aria-hidden />Sair
          </button>
        </div>
      </div>
    </div>
  )
}
