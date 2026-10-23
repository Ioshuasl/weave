'use client'

import { CheckCircle2, Circle, Clock, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useTrainingHook } from '../hooks/useTrainingHook'

const TrainingSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 2 }).map((_, i) => (
      <Card key={i} className="space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-80" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></Card>
    ))}
  </div>
)

export const TrainingIndex = () => {
  const t = useTrainingHook()

  useEffect(() => {
    t.executeLoad()
  }, [t.executeLoad])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Treinamento</h1>
      <p className="text-base text-fg-secondary">Aprenda a criar, editar e publicar seus relatórios no Weave.</p>
      {t.errorMessage && <div className="mt-4"><Alert>{t.errorMessage}</Alert></div>}
      <div className="mt-6 space-y-6">
        {t.isLoading ? (
          <TrainingSkeleton />
        ) : t.tracks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-strong py-12 text-center text-base text-fg-muted">Nenhuma trilha publicada ainda.</p>
        ) : (
          t.tracks.map((track) => {
            const done = track.lessons.filter((l) => t.completedLessonIds.includes(l.id)).length
            const percent = track.lessons.length ? Math.round((done / track.lessons.length) * 100) : 0
            return (
              <Card key={track.id} className="p-0">
                <div className="space-y-2 border-b border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">{track.title}</h2>
                    <span className="text-sm text-fg-muted">{done}/{track.lessons.length} aulas</span>
                  </div>
                  {track.description && <p className="text-sm text-fg-secondary">{track.description}</p>}
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-tertiary" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso em ${track.title}`}>
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {track.lessons.map((l) => {
                    const completed = t.completedLessonIds.includes(l.id)
                    return (
                      <li key={l.id}>
                        <Link href={`/treinamento/${l.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover">
                          {completed ? <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Concluída" /> : <Circle className="size-4 shrink-0 text-fg-muted" aria-hidden />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-medium">{l.title}</span>
                            {l.summary && <span className="block truncate text-sm text-fg-muted">{l.summary}</span>}
                          </span>
                          {l.videoUrl && <PlayCircle className="size-4 text-fg-muted" aria-label="Tem vídeo" />}
                          {l.durationMin && <span className="flex items-center gap-1 text-xs text-fg-muted"><Clock className="size-3.5" aria-hidden />{l.durationMin} min</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
