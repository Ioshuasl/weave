'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { AccountSegmentEnum, AccountSegmentLabel } from '@/shared/enums/AccountSegmentEnum'
import { SubmissionStatusLabel, SubmissionStatusTone } from '@/shared/enums/SubmissionStatusEnum'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { SelectField, TextareaField } from '@/shared/ui/Field'
import { RelativeTime } from '@/shared/ui/RelativeTime'
import type { Submission } from '../types'

interface Props {
  templateDescription: string | null
  defaultSegment: AccountSegmentEnum | null
  submission: Submission | null
  errorMessage: string | null
  onSubmit: (body: { description: string | null; segment: AccountSegmentEnum | null; note: string | null }) => Promise<boolean>
  onCancelPending: () => Promise<void>
  onClose: () => void
}

/** Pedido para publicar o modelo na Biblioteca. O suporte revisa uma cópia congelada do que foi enviado. */
export const LibrarySubmitDialog = ({ templateDescription, defaultSegment, submission, errorMessage, onSubmit, onCancelPending, onClose }: Props) => {
  const [description, setDescription] = useState(templateDescription ?? '')
  const [segment, setSegment] = useState<AccountSegmentEnum | ''>(defaultSegment ?? '')
  const [note, setNote] = useState('')
  const [isSending, setIsSending] = useState(false)
  const isPending = submission?.status === 'PENDING'

  const handleSend = async () => {
    setIsSending(true)
    await onSubmit({ description: description.trim() || null, segment: segment || null, note: note.trim() || null })
    setIsSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="lib-title">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <h2 id="lib-title" className="text-md font-semibold">Enviar para a Biblioteca</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>
        <div className="flex flex-col gap-4 p-4">
          {errorMessage && <Alert>{errorMessage}</Alert>}

          {submission && (
            <div className="rounded-lg border border-border bg-surface-secondary p-3 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                <Badge tone={SubmissionStatusTone[submission.status]}>{SubmissionStatusLabel[submission.status]}</Badge>
                <span className="text-fg-muted">enviado <RelativeTime value={submission.createdAt} /> · versão {submission.versionNumber}</span>
              </p>
              {submission.status === 'REJECTED' && submission.reviewNote && <p className="mt-2 text-fg-secondary"><strong>Motivo:</strong> {submission.reviewNote}</p>}
              {submission.status === 'APPROVED' && <p className="mt-2 text-fg-secondary">Seu modelo já está na Biblioteca. Se você enviar de novo, a nova versão será revisada como um modelo separado.</p>}
              {isPending && <p className="mt-2 text-fg-secondary">A equipe do Weave está avaliando. Você pode cancelar o pedido enquanto ele não for respondido.</p>}
            </div>
          )}

          {isPending ? (
            <footer className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>Fechar</Button>
              <Button variant="destructive" onClick={onCancelPending}>Cancelar pedido</Button>
            </footer>
          ) : (
            <>
              <p className="text-sm text-fg-secondary">
                Seu modelo poderá aparecer na Biblioteca para <strong>todos os usuários</strong>, com o seu nome como criador. A equipe do Weave revisa antes de publicar e o que for avaliado é uma cópia congelada: edições feitas depois não mudam o pedido.
              </p>
              <p className="rounded-md bg-warning-subtle px-3 py-2 text-xs text-warning">Confira se o layout e os dados de exemplo não têm informações reais ou sigilosas (nomes, CPF/CNPJ, valores, logotipos).</p>
              <TextareaField label="Descrição para a Biblioteca" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="Para que serve e quando usar este modelo" />
              <SelectField label="Ramo de atuação" value={segment} onChange={(e) => setSegment(e.target.value as AccountSegmentEnum | '')}>
                <option value="">Não informar</option>
                {Object.values(AccountSegmentEnum).map((s) => <option key={s} value={s}>{AccountSegmentLabel[s]}</option>)}
              </SelectField>
              <TextareaField label="Recado para a equipe (opcional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
              <footer className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button loading={isSending} onClick={handleSend}>Enviar para revisão</Button>
              </footer>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
