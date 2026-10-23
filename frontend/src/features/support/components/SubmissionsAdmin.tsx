'use client'

import { Check, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TagsInput } from '@/features/tags/components/TagsInput'
import type { Submission } from '@/features/sharing/types'
import { AccountSegmentLabel } from '@/shared/enums/AccountSegmentEnum'
import { SubmissionStatusLabel, SubmissionStatusTone } from '@/shared/enums/SubmissionStatusEnum'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { InputField, TextareaField } from '@/shared/ui/Field'
import { PersonChip } from '@/shared/ui/PersonChip'
import { RelativeTime } from '@/shared/ui/RelativeTime'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useSubmissionsAdminHook } from '../hooks/useSubmissionsAdminHook'

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-md font-semibold">{title}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
      </header>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </div>
  </div>
)

const ApproveDialog = ({ submission, onApprove, onClose }: { submission: Submission; onApprove: (body: { tagIds: string[]; name?: string }) => Promise<boolean>; onClose: () => void }) => {
  const [name, setName] = useState(submission.name)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const handleConfirm = async () => {
    setIsSending(true)
    if (await onApprove({ tagIds, name: name.trim() || undefined })) onClose()
    setIsSending(false)
  }
  return (
    <Modal title="Publicar na Biblioteca" onClose={onClose}>
      <p className="text-sm text-fg-secondary">O modelo fica visível para todas as contas, com {submission.submittedBy.name} como criador. Escolha as tags do sistema (ramo e tipo) que o descrevem.</p>
      <InputField label="Nome na Biblioteca" value={name} onChange={(e) => setName(e.target.value)} />
      <TagsInput label="Tags (sistema)" system value={tagIds} onChange={setTagIds} />
      <footer className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button loading={isSending} onClick={handleConfirm}><Check className="size-4" aria-hidden />Publicar</Button>
      </footer>
    </Modal>
  )
}

const RejectDialog = ({ onReject, onClose }: { onReject: (note: string) => Promise<boolean>; onClose: () => void }) => {
  const [note, setNote] = useState('')
  const [isSending, setIsSending] = useState(false)
  const handleConfirm = async () => {
    setIsSending(true)
    if (await onReject(note.trim())) onClose()
    setIsSending(false)
  }
  return (
    <Modal title="Recusar pedido" onClose={onClose}>
      <TextareaField label="Motivo (o autor vai ler)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      <footer className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="destructive" disabled={note.trim().length < 3} loading={isSending} onClick={handleConfirm}>Recusar</Button>
      </footer>
    </Modal>
  )
}

export const SubmissionsAdmin = () => {
  const s = useSubmissionsAdminHook()
  const [toApprove, setToApprove] = useState<Submission | null>(null)
  const [toReject, setToReject] = useState<Submission | null>(null)

  useEffect(() => {
    s.executeLoad()
  }, [s.executeLoad])

  return (
    <section aria-label="Pedidos para a biblioteca">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-secondary">Modelos enviados pelos usuários para a Biblioteca. A revisão é feita sobre uma cópia congelada do que foi enviado.</p>
        <div className="flex gap-1" role="group" aria-label="Filtro">
          <Button size="sm" variant={s.status === 'PENDING' ? 'primary' : 'secondary'} onClick={() => s.handleFilter('PENDING')}>Aguardando</Button>
          <Button size="sm" variant={s.status === 'ALL' ? 'primary' : 'secondary'} onClick={() => s.handleFilter('ALL')}>Todos</Button>
        </div>
      </div>
      {s.errorMessage && <div className="mb-3"><Alert>{s.errorMessage}</Alert></div>}
      {s.notice && <div className="mb-3"><Alert tone="success">{s.notice}</Alert></div>}

      <Card className="divide-y divide-border p-0">
        {s.isLoading ? (
          <div className="space-y-2 p-4"><Skeleton className="h-5 w-56" /><Skeleton className="h-4 w-72" /></div>
        ) : s.items.length === 0 ? (
          <p className="p-4 text-sm text-fg-muted">{s.status === 'PENDING' ? 'Nenhum pedido aguardando revisão.' : 'Nenhum pedido ainda.'}</p>
        ) : (
          s.items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-base font-medium">{item.name}<Badge tone={SubmissionStatusTone[item.status]}>{SubmissionStatusLabel[item.status]}</Badge></p>
                {item.description && <p className="text-sm text-fg-secondary">{item.description}</p>}
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
                  <PersonChip name={item.submittedBy.name} avatarUrl={item.submittedBy.avatarUrl} />
                  {item.accountName && <span>· {item.accountName}</span>}
                  {item.segment && <span>· {AccountSegmentLabel[item.segment]}</span>}
                  <span>· <RelativeTime value={item.createdAt} /></span>
                </p>
                {item.note && <p className="text-sm text-fg-secondary"><strong>Recado:</strong> {item.note}</p>}
                {item.reviewNote && <p className="text-sm text-fg-secondary"><strong>Motivo da recusa:</strong> {item.reviewNote}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link href={`/suporte/revisao/${item.id}`} className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-surface px-2 text-xs font-medium hover:bg-surface-secondary"><Eye className="size-3.5" aria-hidden />Pré-visualizar</Link>
                {item.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => setToApprove(item)}>Aprovar</Button>
                    <Button size="sm" variant="secondary" onClick={() => setToReject(item)}>Recusar</Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {toApprove && <ApproveDialog submission={toApprove} onApprove={(body) => s.handleApprove(toApprove.id, body)} onClose={() => setToApprove(null)} />}
      {toReject && <RejectDialog onReject={(note) => s.handleReject(toReject.id, note)} onClose={() => setToReject(null)} />}
    </section>
  )
}
