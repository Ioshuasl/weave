'use client'

import { Copy, X } from 'lucide-react'
import { useEffect } from 'react'
import { ReadOnlyReport } from '@/features/sharing/components/ReadOnlyReport'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { SelectField } from '@/shared/ui/Field'
import { PersonChip } from '@/shared/ui/PersonChip'
import { Skeleton } from '@/shared/ui/Skeleton'
import { TagBadge } from '@/shared/ui/TagBadge'
import { useLibraryPreviewHook } from '../hooks/useLibraryPreviewHook'
import type { TemplateSummary } from '../types'
import { DataModelSummary } from './DataModelSummary'

interface Props {
  template: TemplateSummary
  canUse: boolean
  onUse: (id: string) => void
  onClose: () => void
}

const SidebarSkeleton = () => (
  <div className="space-y-4"><Skeleton className="h-7 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-6 w-40" /><Skeleton className="h-24 w-full" /></div>
)

/** Biblioteca: prévia ampla do modelo (com os dados de exemplo) à esquerda; detalhes e ações à direita. */
export const LibraryPreviewDialog = ({ template: summary, canUse, onUse, onClose }: Props) => {
  const p = useLibraryPreviewHook(summary.id)

  useEffect(() => {
    p.executeLoad()
  }, [p.executeLoad])

  /** Fecha com Esc; devolve a função que remove o listener. */
  const handleListenEscape = () => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }
  useEffect(handleListenEscape, [])

  const t = p.template ?? summary
  const author = summary.createdBy

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-2 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="lib-prev-title" className="flex h-[min(94dvh,54rem)] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg">
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="relative min-h-[45dvh] min-w-0 flex-1 border-b border-border bg-stage-brand lg:min-h-0 lg:border-b-0 lg:border-r">
            {p.errorMessage ? (
              <div className="p-6"><Alert>{p.errorMessage}</Alert></div>
            ) : p.template ? (
              <ReadOnlyReport key={p.dataset?.id ?? 'sem-dados'} reportId={summary.id} template={{ name: p.template.name, description: p.template.description, document: p.template.document, mockData: p.dataset?.data ?? {} }} />
            ) : (
              <Skeleton className="size-full rounded-none" />
            )}
          </div>

          <aside className="flex max-h-[45dvh] min-h-0 w-full shrink-0 flex-col bg-surface lg:max-h-none lg:w-[22rem]">
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 id="lib-prev-title" className="text-lg font-semibold leading-snug">{t.name}</h2>
                {author && <p className="mt-1 text-xs text-fg-muted"><PersonChip name={author.name} avatarUrl={author.avatarUrl} title={`Criado por ${author.name}`} /></p>}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">Descrição</h3>
                <p className="text-sm text-fg-secondary">{t.description ?? 'Sem descrição.'}</p>
              </section>

              <section>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">Tags</h3>
                {t.tags.length > 0 ? <div className="flex flex-wrap gap-1.5">{t.tags.map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} />)}</div> : <p className="text-sm text-fg-muted">Sem tags.</p>}
              </section>

              <section>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">Modelo de dados</h3>
                {p.isLoading ? (
                  <SidebarSkeleton />
                ) : (
                  <div className="space-y-3">
                    {p.datasets.length > 1 && (
                      <SelectField label="Dados de exemplo" value={p.dataset?.id ?? ''} onChange={(e) => p.handleSelectDataset(e.target.value)}>
                        {p.datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </SelectField>
                    )}
                    <DataModelSummary data={p.dataset?.data ?? {}} />
                    <p className="text-xs text-fg-muted">Ao usar o modelo, você ajusta o layout e conecta os seus próprios dados; estes são só de exemplo.</p>
                  </div>
                )}
              </section>
            </div>

            <footer className="flex justify-end gap-2 border-t border-border bg-surface-secondary px-5 py-3">
              <Button variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button disabled={!canUse} onClick={() => onUse(summary.id)}><Copy className="size-4" aria-hidden />Usar este modelo</Button>
            </footer>
          </aside>
        </div>
      </div>
    </div>
  )
}
