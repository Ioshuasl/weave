'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import type { Lesson } from '@/features/training/types'
import type { LessonInput } from '@/features/training/services/training.service'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { FieldShell } from '@/shared/ui/Field'
import { Markdown } from '@/shared/ui/Markdown'

const input = 'h-9 w-full rounded-md border border-input-border bg-surface px-3 text-base hover:border-border-strong'

interface Props {
  lesson?: Lesson
  onClose: () => void
  onSave: (body: LessonInput, lessonId?: string) => Promise<boolean>
}

export const LessonDialog = ({ lesson, onClose, onSave }: Props) => {
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [summary, setSummary] = useState(lesson?.summary ?? '')
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? '')
  const [duration, setDuration] = useState(lesson?.durationMin ? String(lesson.durationMin) : '')
  const [content, setContent] = useState(lesson?.contentMd ?? '')
  const [published, setPublished] = useState(lesson?.published ?? false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (title.trim().length < 2) return setError('Informe o título da aula.')
    if (videoUrl.trim() && !videoUrl.trim().startsWith('https://')) return setError('O link do vídeo deve começar com https://')
    const minutes = duration.trim() ? Number(duration) : null
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1)) return setError('Duração inválida (minutos inteiros).')
    setIsSaving(true)
    const ok = await onSave(
      { title: title.trim(), summary: summary.trim() || null, videoUrl: videoUrl.trim() || null, durationMin: minutes, contentMd: content, published },
      lesson?.id,
    )
    setIsSaving(false)
    if (ok) onClose()
    else setError('Não foi possível salvar a aula. Confira os campos.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="lesson-title" className="text-md font-semibold">{lesson ? 'Editar aula' : 'Nova aula'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          {error && <Alert>{error}</Alert>}
          <FieldShell label="Título" htmlFor="ls-title"><input id="ls-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} /></FieldShell>
          <FieldShell label="Resumo (opcional)" htmlFor="ls-sum"><input id="ls-sum" className={input} value={summary} onChange={(e) => setSummary(e.target.value)} /></FieldShell>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <FieldShell label="Vídeo (link https, opcional)" htmlFor="ls-video" hint="YouTube, Vimeo ou arquivo .mp4/.webm"><input id="ls-video" className={input} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://" /></FieldShell>
            <FieldShell label="Duração (min)" htmlFor="ls-dur"><input id="ls-dur" className={input} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} /></FieldShell>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="ls-md" className="text-sm font-medium">Conteúdo (Markdown)</label>
              <Button variant="ghost" size="sm" onClick={() => setPreview((v) => !v)}>{preview ? 'Editar' : 'Pré-visualizar'}</Button>
            </div>
            {preview ? (
              <div className="min-h-48 rounded-md border border-border p-3"><Markdown>{content || '*Sem conteúdo*'}</Markdown></div>
            ) : (
              <textarea id="ls-md" rows={12} value={content} onChange={(e) => setContent(e.target.value)} className="w-full rounded-md border border-input-border bg-surface p-3 font-mono text-xs hover:border-border-strong" />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />Publicada</label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={isSaving} onClick={handleSubmit}>Salvar</Button>
        </footer>
      </div>
    </div>
  )
}
