'use client'

import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/shared/ui/Badge'
import { TagBadge } from '@/shared/ui/TagBadge'
import type { TemplateSummary } from '../types'
import { TemplateCopies } from './TemplateCopies'
import { TemplateThumb } from './TemplateThumb'
import { PersonChip } from '@/shared/ui/PersonChip'
import { RelativeTime } from '@/shared/ui/RelativeTime'

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (index: number) => ({ opacity: 1, x: 0, transition: { delay: Math.min(index, 14) * 0.03, type: 'spring', stiffness: 280, damping: 26 } }),
  hover: { x: 3, transition: { type: 'spring', stiffness: 320, damping: 24 } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.12 } },
}

const thumbVariants: Variants = {
  hidden: {},
  visible: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  hover: { scale: 1.12, rotate: -2, transition: { type: 'spring', stiffness: 300, damping: 16 } },
}

interface Props {
  template: TemplateSummary
  copies: TemplateSummary[]
  index: number
  canWrite: boolean
  onOpen: (template: TemplateSummary) => void
  onDelete: (template: TemplateSummary) => void
  onRequestPreview: (templateId: string) => void
}

/** Linha da visualização em lista: miniatura pequena + nome, tags, versão e ação. */
export const TemplateRow = ({ template, copies, index, canWrite, onOpen, onDelete, onRequestPreview }: Props) => {
  const isOwn = !template.isSystem
  return (
    <motion.li
      layout
      custom={index}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      className="group flex items-center gap-4 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors duration-200 hover:border-primary-border hover:bg-surface-hover"
    >
      <div className="flex h-[4.5rem] w-16 shrink-0 items-center justify-center rounded-md bg-stage p-1.5">
        <motion.div variants={thumbVariants} className="h-full rounded-[2px] border border-border-strong/70 shadow-xs" style={{ aspectRatio: '794 / 1123' }}>
          <TemplateThumb template={template} onRequestPreview={onRequestPreview} className="size-full rounded-[1px]" />
        </motion.div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-medium text-foreground">
          {isOwn ? <Link href={`/modelos/${template.id}`} className="after:absolute after:inset-0 hover:text-primary">{template.name}</Link> : <button type="button" onClick={() => onOpen(template)} className="max-w-full truncate text-left after:absolute after:inset-0 hover:text-primary">{template.name}</button>}
        </h3>
        <p className="truncate text-sm text-fg-muted">{template.description ?? 'Sem descrição'}</p>
      </div>

      <div className="hidden min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5 md:flex md:max-w-[34%]">
        {template.isSystem && <Badge tone="primary">Modelo pronto</Badge>}
        {template.tags.slice(0, 3).map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} className="text-xs" />)}
        {template.tags.length > 3 && <span className="text-xs text-fg-muted">+{template.tags.length - 3}</span>}
      </div>

      {isOwn && template.createdBy && <PersonChip name={template.createdBy.name} avatarUrl={template.createdBy.avatarUrl} title={`Criado por ${template.createdBy.name}`} className="hidden w-36 shrink-0 text-xs text-fg-muted xl:inline-flex" />}
      {isOwn && <p className="hidden w-32 shrink-0 text-right text-xs text-fg-muted lg:block"><RelativeTime value={template.updatedAt} /></p>}
      {isOwn && copies.length > 0 && <div className="relative z-10 shrink-0"><TemplateCopies copies={copies} /></div>}

      <div className="relative z-10 flex shrink-0 items-center gap-1">
        {isOwn ? (
          <Link href={`/modelos/${template.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-sm font-medium transition-colors hover:bg-surface-secondary">
            Abrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ) : (
          <button type="button" onClick={() => onOpen(template)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover">
            <Eye className="size-4" aria-hidden />Ver modelo
          </button>
        )}
        {isOwn && canWrite && (
          <button type="button" onClick={() => onDelete(template)} aria-label={`Excluir ${template.name}`} className="flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-destructive-subtle hover:text-destructive">
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </motion.li>
  )
}
