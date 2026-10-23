'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import type { Track } from '@/features/training/types'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { FieldShell } from '@/shared/ui/Field'

const input = 'h-9 w-full rounded-md border border-input-border bg-surface px-3 text-base hover:border-border-strong'

interface Props {
  track?: Track
  onClose: () => void
  onSave: (body: { title: string; description: string | null; published: boolean }, id?: string) => Promise<boolean>
}

export const TrackDialog = ({ track, onClose, onSave }: Props) => {
  const [title, setTitle] = useState(track?.title ?? '')
  const [description, setDescription] = useState(track?.description ?? '')
  const [published, setPublished] = useState(track?.published ?? false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (title.trim().length < 2) return setError('Informe o título da trilha.')
    setIsSaving(true)
    const ok = await onSave({ title: title.trim(), description: description.trim() || null, published }, track?.id)
    setIsSaving(false)
    if (ok) onClose()
    else setError('Não foi possível salvar a trilha.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="track-title">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="track-title" className="text-md font-semibold">{track ? 'Editar trilha' : 'Nova trilha'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>
        <div className="flex flex-col gap-4 p-4">
          {error && <Alert>{error}</Alert>}
          <FieldShell label="Título" htmlFor="tr-title"><input id="tr-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} /></FieldShell>
          <FieldShell label="Descrição (opcional)" htmlFor="tr-desc"><input id="tr-desc" className={input} value={description} onChange={(e) => setDescription(e.target.value)} /></FieldShell>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />Publicada (visível para todos os usuários)</label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={isSaving} onClick={handleSubmit}>Salvar</Button>
        </footer>
      </div>
    </div>
  )
}
