'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { ReadOnlyReport } from '@/features/sharing/components/ReadOnlyReport'
import { sharingService } from '@/features/sharing/services/sharing.service'
import type { SubmissionSnapshot } from '@/features/sharing/types'
import { ApiError } from '@/shared/lib/api'
import { Alert } from '@/shared/ui/Alert'
import { Skeleton } from '@/shared/ui/Skeleton'

/** Pré-visualização, para o suporte, da cópia congelada enviada por um usuário. */
export const SubmissionReview = ({ id }: { id: string }) => {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<SubmissionSnapshot | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isSupport = user?.platformRole === 'SUPPORT'

  const executeLoad = useCallback(async () => {
    try {
      setSnapshot(await sharingService.getSubmission(id))
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível abrir o pedido.')
    }
  }, [id])

  useEffect(() => {
    if (isSupport) executeLoad()
  }, [isSupport, executeLoad])

  if (user && !isSupport) return <div className="mx-auto max-w-4xl px-4 py-8"><Alert>Acesso restrito à equipe de suporte.</Alert></div>

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-2 text-sm">
        <Link href="/suporte" className="inline-flex items-center gap-1 text-fg-secondary hover:text-foreground"><ArrowLeft className="size-4" aria-hidden />Painel do suporte</Link>
        {snapshot && <span className="text-fg-muted">Revisando “{snapshot.name}” · versão {snapshot.versionNumber} enviada por {snapshot.submittedBy.name}</span>}
      </div>
      <div className="min-h-0 flex-1">
        {errorMessage ? <div className="p-6"><Alert>{errorMessage}</Alert></div> : snapshot ? <ReadOnlyReport template={{ name: snapshot.name, description: snapshot.description, document: snapshot.document, mockData: snapshot.mockData ?? {} }} reportId={id} /> : <div className="p-6"><Skeleton className="h-full min-h-[24rem] w-full" /></div>}
      </div>
    </div>
  )
}
