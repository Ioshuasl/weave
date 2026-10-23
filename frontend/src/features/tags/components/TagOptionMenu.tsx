'use client'

import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { TagColorEnum, TagColorLabel, TagColorClasses } from '@/shared/enums/TagColorEnum'
import { cn } from '@/shared/lib/cn'
import type { Tag } from '../types'

interface Props {
  tag: Tag
  onRename: (name: string) => void
  onRecolor: (color: TagColorEnum) => void
  onDelete: () => void
}

/** Menu de edição da opção (renomear, cor, excluir) — igual ao popover "⋯" do Notion. */
export const TagOptionMenu = ({ tag, onRename, onRecolor, onDelete }: Props) => {
  const [name, setName] = useState(tag.name)

  const handleCommitName = () => {
    const next = name.trim()
    if (next && next !== tag.name) onRename(next)
    else setName(tag.name)
  }

  return (
    <div role="dialog" aria-label={`Editar tag ${tag.name}`} className="max-h-[min(24rem,70dvh)] w-56 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-md" onMouseDown={(e) => e.stopPropagation()}>
      <div className="p-1">
        <input
          aria-label="Nome da tag"
          value={name}
          maxLength={40}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onBlur={handleCommitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCommitName()
            }
            e.stopPropagation()
          }}
          className="h-8 w-full rounded-md border border-input-border bg-surface px-2 text-sm hover:border-border-strong"
        />
      </div>
      <button type="button" onClick={onDelete} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-destructive transition-colors hover:bg-destructive-subtle">
        <Trash2 className="size-4" aria-hidden />Excluir
      </button>
      <p className="px-2 pb-1 pt-2 text-xs font-medium text-fg-muted">Cores</p>
      <ul>
        {Object.values(TagColorEnum).map((color) => (
          <li key={color}>
            <button
              type="button"
              onClick={() => onRecolor(color)}
              className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-surface-secondary"
            >
              <span className={cn('size-4 shrink-0 rounded-sm border border-border', TagColorClasses[color].split(' ')[0])} aria-hidden />
              <span className="flex-1 text-left">{TagColorLabel[color]}</span>
              {tag.color === color && <Check className="size-4 text-fg-secondary" aria-label="Cor atual" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
