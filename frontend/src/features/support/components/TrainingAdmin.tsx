'use client'

import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Lesson, Track } from '@/features/training/types'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useTrainingAdminHook } from '../hooks/useTrainingAdminHook'
import { LessonDialog } from './LessonDialog'
import { TrackDialog } from './TrackDialog'

type Editing =
  | { kind: 'track'; track?: Track }
  | { kind: 'lesson'; trackId: string; lesson?: Lesson }
  | null
type Deleting = { kind: 'track'; id: string; name: string } | { kind: 'lesson'; id: string; name: string } | null

export const TrainingAdmin = () => {
  const a = useTrainingAdminHook()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<Deleting>(null)

  useEffect(() => {
    a.executeLoad()
  }, [a.executeLoad])

  return (
    <section aria-label="Gestão do treinamento">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-fg-secondary">Trilhas e aulas exibidas em <strong>Treinamento</strong> para todos os usuários. Só o que está publicado aparece.</p>
        <Button onClick={() => setEditing({ kind: 'track' })}><Plus className="size-4" aria-hidden />Nova trilha</Button>
      </div>
      {a.errorMessage && <div className="mb-3"><Alert>{a.errorMessage}</Alert></div>}
      <div className="space-y-4">
        {a.isLoading ? (
          <Card className="space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-10 w-full" /></Card>
        ) : (
          a.tracks.map((track) => (
            <Card key={track.id} className="p-0">
              <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
                <h3 className="min-w-0 flex-1 truncate text-md font-semibold">{track.title}</h3>
                <Badge tone={track.published ? 'success' : 'warning'}>{track.published ? 'Publicada' : 'Rascunho'}</Badge>
                <Button variant="ghost" size="sm" onClick={() => a.handleTogglePublished('track', track.id, !track.published)} aria-label={track.published ? 'Despublicar trilha' : 'Publicar trilha'}>
                  {track.published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing({ kind: 'track', track })} aria-label={`Editar ${track.title}`}><Pencil className="size-4" aria-hidden /></Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting({ kind: 'track', id: track.id, name: track.title })} aria-label={`Excluir ${track.title}`}><Trash2 className="size-4" aria-hidden /></Button>
              </div>
              <ul className="divide-y divide-border">
                {track.lessons.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                    <span className="min-w-0 flex-1 truncate text-base">{l.title}</span>
                    {l.videoUrl && <Badge>Vídeo</Badge>}
                    <Badge tone={l.published ? 'success' : 'warning'}>{l.published ? 'Publicada' : 'Rascunho'}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => a.handleTogglePublished('lesson', l.id, !l.published)} aria-label={l.published ? 'Despublicar aula' : 'Publicar aula'}>
                      {l.published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ kind: 'lesson', trackId: track.id, lesson: l })} aria-label={`Editar ${l.title}`}><Pencil className="size-4" aria-hidden /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting({ kind: 'lesson', id: l.id, name: l.title })} aria-label={`Excluir ${l.title}`}><Trash2 className="size-4" aria-hidden /></Button>
                  </li>
                ))}
                <li className="px-4 py-3"><Button variant="secondary" size="sm" onClick={() => setEditing({ kind: 'lesson', trackId: track.id })}><Plus className="size-4" aria-hidden />Nova aula</Button></li>
              </ul>
            </Card>
          ))
        )}
      </div>

      {editing?.kind === 'track' && <TrackDialog track={editing.track} onClose={() => setEditing(null)} onSave={a.handleSaveTrack} />}
      {editing?.kind === 'lesson' && (
        <LessonDialog lesson={editing.lesson} onClose={() => setEditing(null)} onSave={(body, id) => a.handleSaveLesson(editing.trackId, body, id)} />
      )}
      {deleting && (
        <ConfirmDialog
          title={deleting.kind === 'track' ? 'Excluir trilha' : 'Excluir aula'}
          description={deleting.kind === 'track' ? `"${deleting.name}" e todas as suas aulas serão excluídas.` : `A aula "${deleting.name}" será excluída.`}
          confirmLabel="Excluir"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await (deleting.kind === 'track' ? a.handleDeleteTrack(deleting.id) : a.handleDeleteLesson(deleting.id))
            setDeleting(null)
          }}
        />
      )}
    </section>
  )
}
