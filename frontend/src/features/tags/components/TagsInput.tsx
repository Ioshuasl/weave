'use client'

import { MoreHorizontal, Plus } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { TagColorEnum } from '@/shared/enums/TagColorEnum'
import { cn } from '@/shared/lib/cn'
import { TagBadge } from '@/shared/ui/TagBadge'
import { useTagsHook } from '../hooks/useTagsHook'
import { TagOptionMenu } from './TagOptionMenu'

interface Props {
  label: string
  value: string[]
  onChange: (tagIds: string[]) => void
  /** true = trabalha só com tags do sistema (suporte em modelos prontos) */
  system?: boolean
  error?: string
  /** 'inline': sem borda até o hover, para editar tags direto numa página (estilo Notion) */
  variant?: 'field' | 'inline'
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Campo de tags no padrão do Notion: tags selecionadas como pílulas no campo, digite para filtrar,
 * "Criar <texto>" para uma tag nova, Backspace remove a última, "⋯" edita nome/cor/exclui a opção.
 */
export const TagsInput = ({ label, value, onChange, system = false, error, variant = 'field' }: Props) => {
  const inline = variant === 'inline'
  const tagsHook = useTagsHook()
  const { tags, executeLoad } = tagsHook
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()

  useEffect(() => {
    executeLoad()
  }, [executeLoad])

  const handleListenOutsideClick = () => {
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false)
        setMenuFor(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }
  useEffect(handleListenOutsideClick, [])

  // com system=true só as tags do sistema; caso contrário, as do sistema e da conta
  const usable = useMemo(() => (system ? tags.filter((t) => t.system) : tags), [tags, system])
  const selected = value.map((id) => usable.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t))
  const term = normalize(query.trim())
  const options = usable.filter((t) => !value.includes(t.id) && (!term || normalize(t.name).includes(term)))
  const exact = usable.find((t) => normalize(t.name) === term)
  const canCreate = term.length > 0 && !exact
  const rowCount = options.length + (canCreate ? 1 : 0)

  const handleSelect = (id: string) => {
    onChange([...value, id])
    setQuery('')
    setActive(0)
    input.current?.focus()
  }

  const handleCreateFromQuery = async () => {
    const created = await tagsHook.handleCreate(query.trim(), system)
    if (created) handleSelect(created.id)
  }

  const handleEnter = () => {
    if (rowCount === 0) return
    const index = Math.min(active, rowCount - 1)
    if (index < options.length) handleSelect(options[index]!.id)
    else handleCreateFromQuery()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (rowCount ? (i + 1) % rowCount : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (rowCount ? (i - 1 + rowCount) % rowCount : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open) handleEnter()
    } else if (e.key === 'Escape') {
      if (open) e.stopPropagation()
      setOpen(false)
      setMenuFor(null)
    } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (await tagsHook.handleDelete(id)) {
      onChange(value.filter((v) => v !== id))
      setMenuFor(null)
    }
  }

  const menuTag = menuFor ? usable.find((t) => t.id === menuFor) : undefined

  return (
    <div ref={root} className="relative flex flex-col gap-1">
      <label htmlFor={`${listId}-input`} className={cn('text-sm font-medium text-foreground', inline && 'sr-only')}>{label}</label>
      <div
        onClick={() => {
          setOpen(true)
          input.current?.focus()
        }}
        className={cn(
          'flex w-full cursor-text flex-wrap items-center gap-1 rounded-md border px-2 py-1 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
          inline ? 'min-h-8 border-transparent bg-transparent hover:bg-surface-secondary -mx-2' : 'min-h-9 border-input-border bg-surface hover:border-border-strong',
          error && 'border-destructive',
        )}
      >
        {inline && <Plus className="size-4 shrink-0 text-fg-muted" aria-hidden />}
        {selected.map((t) => (
          <TagBadge key={t.id} name={t.name} color={t.color} onRemove={() => onChange(value.filter((v) => v !== t.id))} />
        ))}
        <input
          ref={input}
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && rowCount ? `${listId}-opt-${Math.min(active, rowCount - 1)}` : undefined}
          value={query}
          maxLength={40}
          placeholder={selected.length === 0 ? (inline ? 'Adicionar tag' : 'Buscar ou criar tags…') : inline ? 'Adicionar' : ''}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className={cn('h-7 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder', inline ? 'min-w-20' : 'min-w-24')}
        />
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      {tagsHook.errorMessage && <p className="text-xs text-destructive" role="alert">{tagsHook.errorMessage}</p>}

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-md">
          <p className="px-3 pb-1 pt-2 text-xs text-fg-muted">Selecione uma opção ou crie uma</p>
          <ul id={listId} role="listbox" aria-label="Tags" className="max-h-56 overflow-y-auto p-1">
            {options.map((t, i) => (
              <li
                key={t.id}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActive(i)}
                className={cn('group flex items-center gap-2 rounded-md px-2 py-1', active === i && 'bg-surface-secondary')}
              >
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelect(t.id)} className="flex min-w-0 flex-1 items-center">
                  <TagBadge name={t.name} color={t.color} />
                </button>
                {t.system && !system && <span className="text-xs text-fg-muted">do sistema</span>}
                <button
                  type="button"
                  aria-label={`Editar tag ${t.name}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMenuFor(menuFor === t.id ? null : t.id)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-sm text-fg-muted opacity-0 transition-opacity hover:bg-surface-tertiary focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </button>
              </li>
            ))}
            {canCreate && (
              <li
                id={`${listId}-opt-${options.length}`}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActive(options.length)}
                className={cn('rounded-md', active === options.length && 'bg-surface-secondary')}
              >
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleCreateFromQuery} className="flex w-full items-center gap-2 px-2 py-1 text-sm text-fg-secondary">
                  <Plus className="size-4" aria-hidden />Criar <TagBadge name={query.trim()} color={TagColorEnum.GRAY} />
                </button>
              </li>
            )}
            {rowCount === 0 && <li className="px-2 py-2 text-sm text-fg-muted">{usable.length === 0 ? 'Nenhuma tag ainda. Digite para criar.' : 'Nenhuma outra tag.'}</li>}
          </ul>

          {menuTag && (
            <div className="absolute right-0 top-0 z-50 translate-x-0 md:left-full md:right-auto md:ml-1">
              <TagOptionMenu
                tag={menuTag}
                onRename={(name) => tagsHook.handleUpdate(menuTag.id, { name })}
                onRecolor={(color) => tagsHook.handleUpdate(menuTag.id, { color })}
                onDelete={() => handleDeleteTag(menuTag.id)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
