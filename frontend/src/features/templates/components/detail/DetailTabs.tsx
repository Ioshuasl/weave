'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface DetailTab<T extends string> {
  id: T
  label: string
  icon: LucideIcon
  count?: number
}

/** Abas com indicador deslizante (layoutId) e contador. */
export const DetailTabs = <T extends string>({ tabs, value, onChange }: { tabs: DetailTab<T>[]; value: T; onChange: (id: T) => void }) => (
  <div role="tablist" aria-label="Seções do modelo" className="relative flex gap-1 border-b border-border">
    {tabs.map(({ id, label, icon: Icon, count }) => {
      const active = value === id
      return (
        <button
          key={id}
          type="button"
          role="tab"
          id={`tab-${id}`}
          aria-selected={active}
          aria-controls={`panel-${id}`}
          onClick={() => onChange(id)}
          className={cn('relative flex h-11 items-center gap-2 px-3 text-sm font-medium transition-colors', active ? 'text-primary' : 'text-fg-secondary hover:text-foreground')}
        >
          <Icon className="size-4" aria-hidden />
          {label}
          {count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-xs transition-colors', active ? 'bg-primary-subtle text-primary' : 'bg-surface-secondary text-fg-muted')}>{count}</span>
          )}
          {active && <motion.span layoutId="detail-tab-indicator" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
        </button>
      )
    })}
  </div>
)
