'use client'

import { Check, Loader2, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'

interface Props {
  value: string
  onSave: (next: string) => Promise<boolean>
  /** texto exibido quando vazio (ex.: "Adicionar descrição") */
  placeholder: string
  ariaLabel: string
  multiline?: boolean
  maxLength?: number
  /** nome obrigatório? (descrição pode ficar vazia) */
  required?: boolean
  readOnly?: boolean
  className?: string
}

/**
 * Texto editável no lugar (estilo Notion): clique, digite e confirme com Enter (ou clique fora);
 * Esc cancela. Mostra um lápis discreto no hover e um "salvo" rápido ao concluir.
 */
export const InlineEditableText = ({ value, onSave, placeholder, ariaLabel, multiline = false, maxLength = 120, required = false, readOnly = false, className }: Props) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  const handleFocusOnEdit = () => {
    if (!editing || !field.current) return
    field.current.focus()
    field.current.setSelectionRange(field.current.value.length, field.current.value.length)
  }
  useEffect(handleFocusOnEdit, [editing])

  const handleSyncExternal = () => {
    if (!editing) setDraft(value)
  }
  useEffect(handleSyncExternal, [value, editing])

  const handleFlashSaved = () => {
    if (status !== 'saved') return undefined
    const id = window.setTimeout(() => setStatus('idle'), 1500)
    return () => window.clearTimeout(id)
  }
  useEffect(handleFlashSaved, [status])

  const handleCommit = async () => {
    const next = draft.trim()
    setEditing(false)
    if (next === value.trim() || (required && next === '')) {
      setDraft(value)
      return
    }
    setStatus('saving')
    const ok = await onSave(next)
    setStatus(ok ? 'saved' : 'idle')
    if (!ok) setDraft(value)
  }

  const handleCancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (readOnly) return <span className={className}>{value || <span className="text-fg-muted">{placeholder}</span>}</span>

  if (editing) {
    const common = {
      value: draft,
      maxLength,
      'aria-label': ariaLabel,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: handleCommit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') handleCancel()
        if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
          e.preventDefault()
          handleCommit()
        }
      },
      className: cn('-mx-2 w-[calc(100%+1rem)] rounded-md border border-primary-border bg-surface px-2 py-0.5 outline-2 outline-offset-2 outline-ring', className),
    }
    return multiline ? <textarea ref={field} rows={2} {...common} className={cn(common.className, 'resize-none')} /> : <input ref={field} {...common} />
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`${ariaLabel}: ${value || 'vazio'}. Clique para editar`}
      className={cn('group/edit -mx-2 inline-flex max-w-[calc(100%+1rem)] items-start gap-2 rounded-md px-2 py-0.5 text-left transition-colors hover:bg-surface-secondary', className)}
    >
      <span className={cn('min-w-0 break-words', !value && 'text-fg-muted')}>{value || placeholder}</span>
      <span className="mt-1.5 flex size-4 shrink-0 items-center justify-center text-fg-muted opacity-0 transition-opacity group-hover/edit:opacity-100 group-focus-visible/edit:opacity-100 [@media(hover:none)]:opacity-60" aria-hidden>
        {status === 'saving' ? <Loader2 className="size-3.5 animate-spin" /> : status === 'saved' ? <Check className="size-3.5 text-success" /> : <Pencil className="size-3.5" />}
      </span>
    </button>
  )
}
