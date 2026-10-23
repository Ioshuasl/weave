'use client'

import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { A4_PORTRAIT_RATIO, sheetBoxStyle } from '@/shared/actions/sheetBoxStyle'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/Badge'
import { TagBadge } from '@/shared/ui/TagBadge'
import type { TemplateSummary } from '../types'
import { TemplateCopies } from './TemplateCopies'
import { TemplateThumb } from './TemplateThumb'
import { PersonChip } from '@/shared/ui/PersonChip'
import { RelativeTime } from '@/shared/ui/RelativeTime'

/* sombras do design system (design-weave.md §4.3) */
const SHADOW_SM = '0 1px 3px rgb(15 23 42 / 8%)'
const SHADOW_LG = '0 12px 32px rgb(15 23 42 / 14%)'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: (index: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(index, 12) * 0.035, type: 'spring', stiffness: 260, damping: 24 } }),
  hover: { y: -4, transition: { type: 'spring', stiffness: 300, damping: 22 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
}

/** A folha "levanta", endireita e cresce quando o mouse entra no card (herda o estado `hover` do card). */
const sheetVariants: Variants = {
  hidden: {},
  visible: { rotate: -1.6, y: 0, scale: 1, boxShadow: SHADOW_SM, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  hover: { rotate: 0, y: -8, scale: 1.06, boxShadow: SHADOW_LG, transition: { type: 'spring', stiffness: 260, damping: 18 } },
}

interface Props {
  template: TemplateSummary
  copies: TemplateSummary[]
  index: number
  canWrite: boolean
  /** abre a pré-visualização ampla (modelos da biblioteca) */
  onOpen: (template: TemplateSummary) => void
  onDelete: (template: TemplateSummary) => void
  onRequestPreview: (templateId: string) => void
}

export const TemplateCard = ({ template, copies, index, canWrite, onOpen, onDelete, onRequestPreview }: Props) => {
  const isOwn = !template.isSystem
  const [ratio, setRatio] = useState(A4_PORTRAIT_RATIO)
  return (
    <motion.article
      layout
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      className="group relative flex flex-col rounded-xl border border-border bg-surface transition-colors duration-200 hover:border-primary-border"
    >
      {/* palco: fundo colorido com pontos, para a folha branca se destacar do card branco */}
      <div
        className={cn('relative flex h-[19rem] items-center justify-center rounded-t-xl px-5 py-5', isOwn ? 'bg-stage' : 'bg-stage-brand')}
        style={{ backgroundImage: 'radial-gradient(rgb(15 23 42 / 9%) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
      >
        {isOwn ? (
          <Link href={`/modelos/${template.id}`} aria-label={`Abrir ${template.name}`} className="absolute inset-0 z-0" tabIndex={-1} />
        ) : (
          <button type="button" aria-label={`Ver ${template.name}`} onClick={() => onOpen(template)} className="absolute inset-0 z-0 cursor-pointer" tabIndex={-1} />
        )}

        <motion.div variants={sheetVariants} className="pointer-events-none relative z-0 max-h-[15.5rem] max-w-full origin-bottom rounded-[3px] border border-border-strong/70 bg-surface" style={sheetBoxStyle(ratio)}>
          <TemplateThumb template={template} onRequestPreview={onRequestPreview} onRatio={setRatio} className="size-full rounded-[2px]" />
        </motion.div>

        {isOwn && canWrite && (
          <button
            type="button"
            onClick={() => onDelete(template)}
            aria-label={`Excluir ${template.name}`}
            className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-md bg-surface/90 text-fg-secondary opacity-0 shadow-xs transition-all hover:bg-destructive-subtle hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}

        {/* ação principal: aparece no hover/foco (sempre visível em telas de toque) */}
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center opacity-0 transition-all duration-200 ease-out translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
          {isOwn ? (
            <Link href={`/modelos/${template.id}`} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg shadow-md transition-colors hover:bg-primary-hover">
              Abrir <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <button type="button" onClick={() => onOpen(template)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg shadow-md transition-colors hover:bg-primary-hover">
              <Eye className="size-4" aria-hidden />Ver modelo
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-border p-4">
        <div className="min-w-0">
          <h3 className="truncate text-md font-medium text-foreground">
            {isOwn ? <Link href={`/modelos/${template.id}`} className="transition-colors hover:text-primary">{template.name}</Link> : <button type="button" onClick={() => onOpen(template)} className="max-w-full truncate text-left transition-colors hover:text-primary">{template.name}</button>}
          </h3>
          <p className="truncate text-sm text-fg-muted">{template.description ?? 'Sem descrição'}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {template.isSystem && <Badge tone="primary">Modelo pronto</Badge>}
          {template.tags.slice(0, 3).map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} className="text-xs" />)}
          {template.tags.length > 3 && <span className="text-xs text-fg-muted">+{template.tags.length - 3}</span>}
        </div>
        {(isOwn || template.createdBy) && (
          <div className="flex items-center justify-between gap-2 text-xs text-fg-muted">
            {isOwn && <p className="min-w-0 truncate"><RelativeTime value={template.updatedAt} prefix="Atualizado" /></p>}
            {isOwn && <TemplateCopies copies={copies} />}
            {template.createdBy && <PersonChip name={template.createdBy.name} avatarUrl={template.createdBy.avatarUrl} className="ml-auto max-w-[45%]" title={`Criado por ${template.createdBy.name}`} />}
          </div>
        )}
      </div>
    </motion.article>
  )
}
