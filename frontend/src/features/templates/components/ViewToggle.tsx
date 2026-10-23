'use client'

import { motion } from 'framer-motion'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export type TemplatesViewMode = 'grid' | 'list'

const OPTIONS = [
  { id: 'grid', label: 'Grade', icon: LayoutGrid },
  { id: 'list', label: 'Lista', icon: List },
] as const

/** Alternância grade ⇄ lista com indicador deslizante. */
export const ViewToggle = ({ value, onChange }: { value: TemplatesViewMode; onChange: (mode: TemplatesViewMode) => void }) => (
  <div role="radiogroup" aria-label="Modo de visualização" className="relative flex h-9 shrink-0 rounded-md border border-border bg-surface-secondary p-0.5">
    {OPTIONS.map(({ id, label, icon: Icon }) => {
      const active = value === id
      return (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={active}
          aria-label={label}
          title={label}
          onClick={() => onChange(id)}
          className={cn('relative z-10 flex w-9 items-center justify-center rounded-[5px] transition-colors', active ? 'text-primary' : 'text-fg-muted hover:text-foreground')}
        >
          {active && <motion.span layoutId="templates-view-indicator" className="absolute inset-0 rounded-[5px] bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
          <Icon className="relative size-4" aria-hidden />
        </button>
      )
    })}
  </div>
)
