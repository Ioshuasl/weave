'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { TemplateSummary } from '../types'
import { RelativeTime } from '@/shared/ui/RelativeTime'

/** "+N cópias": as outras cópias do mesmo modelo ficam num menu (a galeria mostra só a mais recente). */
export const TemplateCopies = ({ copies }: { copies: TemplateSummary[] }) => {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const handleListenOutside = () => {
    if (!open) return undefined
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }
  useEffect(handleListenOutside, [open])

  if (copies.length === 0) return null

  return (
    <div ref={root} className="relative z-20">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-6 items-center gap-1 rounded-sm bg-surface-secondary px-1.5 text-xs font-medium text-fg-secondary transition-colors hover:bg-surface-tertiary"
      >
        <Layers className="size-3" aria-hidden />+{copies.length} {copies.length === 1 ? 'cópia' : 'cópias'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute bottom-full right-0 mb-1 w-64 origin-bottom-right rounded-lg border border-border bg-surface p-1 shadow-md"
          >
            <p className="px-2 pb-1 pt-1.5 text-xs text-fg-muted">Outras cópias deste modelo</p>
            {copies.map((c) => (
              <Link key={c.id} href={`/modelos/${c.id}`} role="menuitem" className="block rounded-md px-2 py-1.5 transition-colors hover:bg-surface-secondary">
                <span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
                <span className="block text-xs text-fg-muted">v{c.currentVersion} · <RelativeTime value={c.updatedAt} prefix="atualizado" /></span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
