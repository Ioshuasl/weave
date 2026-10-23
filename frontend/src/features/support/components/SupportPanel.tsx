'use client'

import { useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Skeleton } from '@/shared/ui/Skeleton'
import { SubmissionsAdmin } from './SubmissionsAdmin'
import { SystemTemplatesAdmin } from './SystemTemplatesAdmin'
import { TrainingAdmin } from './TrainingAdmin'

const TABS = [
  { id: 'templates', label: 'Modelos prontos' },
  { id: 'submissions', label: 'Pedidos da biblioteca' },
  { id: 'training', label: 'Treinamento' },
] as const

export const SupportPanel = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('templates')

  if (!user) return <div className="mx-auto max-w-4xl px-4 py-8"><Skeleton className="h-8 w-64" /></div>
  if (user.platformRole !== 'SUPPORT') {
    return <div className="mx-auto max-w-4xl px-4 py-8"><Alert>Acesso restrito à equipe de suporte.</Alert></div>
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Painel do suporte</h1>
      <p className="text-base text-fg-secondary">Mantenha os modelos prontos e o conteúdo de treinamento da plataforma.</p>
      <div role="tablist" aria-label="Seções do suporte" className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px h-10 border-b-2 px-3 text-sm font-medium transition-colors',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-fg-secondary hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6" role="tabpanel">{tab === 'templates' ? <SystemTemplatesAdmin /> : tab === 'submissions' ? <SubmissionsAdmin /> : <TrainingAdmin />}</div>
    </div>
  )
}
