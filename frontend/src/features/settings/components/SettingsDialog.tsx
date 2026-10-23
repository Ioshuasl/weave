'use client'

import { Bell, CreditCard, Plug, Shield, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { ComingSoonSection } from './ComingSoonSection'
import { ProfileSection } from './ProfileSection'
import { SecuritySection } from './SecuritySection'

const SECTIONS = [
  { id: 'profile', label: 'Meu perfil', icon: User },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'billing', label: 'Cobrança', icon: CreditCard },
  { id: 'integrations', label: 'Integrações', icon: Plug },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export const SettingsDialog = ({ onClose }: { onClose: () => void }) => {
  const [section, setSection] = useState<SectionId>('profile')

  /** Fecha com Esc; devolve a função que remove o listener. */
  const handleListenEscape = () => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }
  useEffect(handleListenEscape, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-2 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="flex h-[min(92dvh,52rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg">
        <header className="flex items-start justify-between gap-3 border-b border-border bg-surface px-5 py-4">
          <div>
            <h2 id="settings-title" className="text-xl font-semibold">Configurações da conta</h2>
            <p className="text-sm text-fg-secondary">Atualize seu perfil, acesso, notificações e preferências de cobrança.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav aria-label="Seções" className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-surface p-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:p-3">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={section === id ? 'page' : undefined}
                onClick={() => setSection(id)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                  section === id ? 'bg-surface-selected text-primary' : 'text-fg-secondary hover:bg-surface-secondary hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />{label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {section === 'profile' && <ProfileSection />}
            {section === 'security' && <SecuritySection />}
            {section === 'notifications' && <ComingSoonSection icon={Bell} title="Notificações" description="Escolha como e quando receber avisos sobre convites, relatórios e treinamentos." />}
            {section === 'billing' && <ComingSoonSection icon={CreditCard} title="Cobrança" description="Plano, faturas e forma de pagamento da conta." />}
            {section === 'integrations' && <ComingSoonSection icon={Plug} title="Integrações" description="Conecte o Weave a outras ferramentas e automações." />}
          </div>
        </div>
      </div>
    </div>
  )
}
