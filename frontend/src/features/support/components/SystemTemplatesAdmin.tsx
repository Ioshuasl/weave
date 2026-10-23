'use client'

import { PenTool, Plus, Upload } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TemplateFormDialog } from '@/features/templates/components/TemplateFormDialog'
import type { TemplateSummary } from '@/features/templates/types'
import { TagBadge } from '@/shared/ui/TagBadge'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useSystemTemplatesHook } from '../hooks/useSystemTemplatesHook'
import { RelativeTime } from '@/shared/ui/RelativeTime'

export const SystemTemplatesAdmin = () => {
  const s = useSystemTemplatesHook()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [toUnpublish, setToUnpublish] = useState<TemplateSummary | null>(null)
  const [publishId, setPublishId] = useState('')

  useEffect(() => {
    s.executeLoad()
  }, [s.executeLoad])

  return (
    <section aria-label="Modelos prontos">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-secondary">Modelos exibidos como <strong>Modelo pronto</strong> na galeria de todas as contas.</p>
        <Button onClick={() => setIsCreateOpen(true)}><Plus className="size-4" aria-hidden />Novo modelo pronto</Button>
      </div>
      {s.errorMessage && <div className="mb-3"><Alert>{s.errorMessage}</Alert></div>}
      {s.notice && <div className="mb-3"><Alert tone="success">{s.notice}</Alert></div>}

      <Card className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="pub-select" className="mb-1 block text-sm font-medium">Publicar um modelo da minha conta como modelo pronto</label>
          <select id="pub-select" value={publishId} onChange={(e) => setPublishId(e.target.value)} className="h-9 w-full rounded-md border border-input-border bg-surface px-2 text-base">
            <option value="">Selecione…</option>
            {s.own.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <Button
          variant="secondary"
          disabled={!publishId}
          onClick={async () => {
            await s.handlePublish(publishId)
            setPublishId('')
          }}
        >
          <Upload className="size-4" aria-hidden />Publicar cópia
        </Button>
      </Card>

      <Card className="divide-y divide-border p-0">
        {s.isLoading ? (
          <div className="space-y-2 p-4"><Skeleton className="h-5 w-56" /><Skeleton className="h-4 w-40" /></div>
        ) : s.system.length === 0 ? (
          <p className="p-4 text-sm text-fg-muted">Nenhum modelo pronto publicado.</p>
        ) : (
          s.system.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium">{t.name}</p>
                <p className="text-sm text-fg-muted">{t.description ?? '—'} · v{t.currentVersion} · <RelativeTime value={t.updatedAt} prefix="atualizado" /></p>
              </div>
              <span className="flex flex-wrap gap-1">{t.tags.map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} className="text-xs" />)}</span>
              <Link href={`/modelos/${t.id}`} className="inline-flex h-7 items-center rounded-md border border-border bg-surface px-2 text-xs font-medium hover:bg-surface-secondary">Detalhes</Link>
              <Link href={`/editor/${t.id}`} className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-xs font-medium text-primary-fg hover:bg-primary-hover"><PenTool className="size-3.5" aria-hidden />Editar</Link>
              <Button variant="ghost" size="sm" onClick={() => setToUnpublish(t)}>Despublicar</Button>
            </div>
          ))
        )}
      </Card>

      {isCreateOpen && <TemplateFormDialog system title="Novo modelo pronto" submitLabel="Criar e abrir editor" onClose={() => setIsCreateOpen(false)} onSubmit={s.handleCreate} />}
      {toUnpublish && (
        <ConfirmDialog
          title="Despublicar modelo pronto"
          description={`"${toUnpublish.name}" deixa de aparecer na galeria. Cópias já feitas pelos usuários não são afetadas.`}
          confirmLabel="Despublicar"
          onCancel={() => setToUnpublish(null)}
          onConfirm={async () => {
            await s.handleUnpublish(toUnpublish.id)
            setToUnpublish(null)
          }}
        />
      )}
    </section>
  )
}
