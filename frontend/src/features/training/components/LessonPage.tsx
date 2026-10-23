'use client'

import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Markdown } from '@/shared/ui/Markdown'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VideoPlayer } from '@/shared/ui/VideoPlayer'
import { useLessonHook } from '../hooks/useLessonHook'

export const LessonPage = ({ lessonId }: { lessonId: string }) => {
  const l = useLessonHook(lessonId)

  useEffect(() => {
    l.executeLoad()
  }, [l.executeLoad])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/treinamento" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-secondary hover:text-foreground"><ArrowLeft className="size-4" aria-hidden />Treinamento</Link>
      {l.errorMessage && <Alert>{l.errorMessage}</Alert>}
      {l.isLoading ? (
        <div className="space-y-4"><Skeleton className="h-8 w-80" /><Skeleton className="aspect-video w-full" /><Skeleton className="h-24 w-full" /></div>
      ) : (
        l.lesson && (
          <article className="space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold">{l.lesson.title}</h1>
                {l.lesson.summary && <p className="text-base text-fg-secondary">{l.lesson.summary}</p>}
              </div>
              <Button variant={l.lesson.completed ? 'secondary' : 'primary'} onClick={l.handleToggleCompleted}>
                <Check className="size-4" aria-hidden />{l.lesson.completed ? 'Concluída' : 'Marcar como concluída'}
              </Button>
            </header>
            <VideoPlayer url={l.lesson.videoUrl} title={l.lesson.title} />
            <Markdown>{l.lesson.contentMd}</Markdown>
          </article>
        )
      )}
    </div>
  )
}
