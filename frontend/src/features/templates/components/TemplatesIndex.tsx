'use client'

import { AnimatePresence, LayoutGroup, motion, MotionConfig } from 'framer-motion'
import { FileSearch, Info, Library, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { AccountSegmentEnum } from '@/shared/enums/AccountSegmentEnum'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import { TagBadge } from '@/shared/ui/TagBadge'
import { usePreviewGeneratorHook } from '../hooks/usePreviewGeneratorHook'
import { useTemplatesHook, type TemplatesScope } from '../hooks/useTemplatesHook'
import { useTemplatesViewHook } from '../hooks/useTemplatesViewHook'
import type { TemplateSummary } from '../types'
import { TemplateCard } from './TemplateCard'
import { LibraryPreviewDialog } from './LibraryPreviewDialog'
import { TemplateFormDialog } from './TemplateFormDialog'
import { TemplateRow } from './TemplateRow'
import { ViewToggle } from './ViewToggle'

const GridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex h-[19rem] items-center justify-center bg-stage px-5 py-5"><Skeleton className="h-full max-h-[15.5rem] w-auto bg-surface" style={{ aspectRatio: '794 / 1123' }} /></div>
        <div className="space-y-2 border-t border-border p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-5 w-24" /></div>
      </div>
    ))}
  </div>
)

const ListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3"><Skeleton className="size-14" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-8 w-24" /></div>
    ))}
  </div>
)

export const TemplatesIndex = ({ scope }: { scope: TemplatesScope }) => {
  const { activeMembership } = useAuth()
  const t = useTemplatesHook(scope)
  const previews = usePreviewGeneratorHook(t.handlePreviewReady)
  const view = useTemplatesViewHook()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [toPreview, setToPreview] = useState<TemplateSummary | null>(null)
  const [toDelete, setToDelete] = useState<TemplateSummary | null>(null)
  const canWrite = activeMembership?.role !== undefined && activeMembership.role !== 'VIEWER'
  const isLibrary = scope === 'library'
  const segment = activeMembership?.accountSegment
  const hasFilter = t.tagFilter !== 'ALL' || t.search.trim() !== ''

  useEffect(() => {
    t.executeLoad()
  }, [t.executeLoad])

  useEffect(view.handleRestore, [])

  const handleClearFilters = () => {
    t.setTagFilter('ALL')
    t.setSearch('')
  }

  const cardProps = { canWrite, onOpen: setToPreview, onDelete: setToDelete, onRequestPreview: previews.handleRequest }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{isLibrary ? 'Biblioteca de modelos' : 'Meus modelos'}</h1>
            <p className="text-base text-fg-secondary">{isLibrary ? 'Modelos prontos para começar: escolha um e ele vira uma cópia sua, que você pode editar à vontade.' : 'Os modelos que você criou ou copiou da biblioteca.'}</p>
          </div>
          {canWrite && !isLibrary && <Button onClick={() => setIsCreateOpen(true)}><Plus className="size-4" aria-hidden />Novo modelo</Button>}
        </div>

        {t.errorMessage && <div className="mt-4"><Alert>{t.errorMessage}</Alert></div>}
        {isLibrary && segment && segment !== AccountSegmentEnum.CARTORIO && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary-border bg-primary-subtle px-3 py-2 text-sm text-fg-secondary">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p>Por enquanto, os modelos prontos são de cartórios e serventias. Modelos para o seu ramo estão chegando; você já pode copiar um deles como ponto de partida ou começar do zero em Meus modelos.</p>
          </div>
        )}

        <LayoutGroup>
          <div className="mt-6 grid gap-6 md:grid-cols-[208px_minmax(0,1fr)]">
            <nav aria-label="Tags" className="flex gap-1 overflow-x-auto md:sticky md:top-20 md:max-h-[calc(100dvh-6rem)] md:flex-col md:self-start md:overflow-y-auto">
              {[{ id: 'ALL', node: <span className="text-sm font-medium">Todos</span>, count: t.total }, ...t.tagOptions.map(({ tag, count }) => ({ id: tag.id, node: <TagBadge name={tag.name} color={tag.color} />, count }))].map((opt) => {
                const active = t.tagFilter === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => t.setTagFilter(opt.id)}
                    className={cn('relative flex h-9 shrink-0 items-center justify-between gap-3 rounded-md px-3 transition-colors', active ? 'text-primary' : 'text-fg-secondary hover:bg-surface-secondary')}
                  >
                    {active && <motion.span layoutId="tag-filter-indicator" className="absolute inset-0 rounded-md bg-surface-selected" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <span className="relative">{opt.node}</span>
                    <span className="relative text-xs text-fg-muted">{opt.count}</span>
                  </button>
                )
              })}
            </nav>

            <section aria-label={isLibrary ? 'Biblioteca' : 'Meus modelos'}>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
                  <input
                    type="search"
                    value={t.search}
                    onChange={(e) => t.setSearch(e.target.value)}
                    placeholder="Buscar por nome ou tag..."
                    aria-label="Buscar modelos"
                    className="h-9 w-full rounded-md border border-input-border bg-surface pl-9 pr-3 text-base placeholder:text-placeholder transition-colors hover:border-border-strong"
                  />
                </div>
                <p className="hidden shrink-0 text-sm text-fg-muted sm:block" aria-live="polite">{t.isLoading ? '' : `${t.filtered.length} ${t.filtered.length === 1 ? 'modelo' : 'modelos'}`}</p>
                <ViewToggle value={view.view} onChange={view.handleChange} />
              </div>

              {t.isLoading ? (
                view.view === 'grid' ? <GridSkeleton /> : <ListSkeleton />
              ) : t.filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong py-16 text-center">
                  <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="flex size-12 items-center justify-center rounded-full bg-surface-secondary text-fg-muted"><FileSearch className="size-6" aria-hidden /></motion.span>
                  <div>
                    <p className="text-md font-medium">{hasFilter ? 'Nenhum modelo encontrado' : isLibrary ? 'A biblioteca ainda está vazia' : 'Você ainda não tem modelos'}</p>
                    <p className="text-sm text-fg-muted">{hasFilter ? 'Tente outra busca ou remova os filtros.' : isLibrary ? 'Novos modelos prontos serão adicionados em breve.' : 'Comece por um modelo da biblioteca ou crie o seu do zero.'}</p>
                  </div>
                  {!hasFilter && !isLibrary && <Link href="/biblioteca" className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-secondary"><Library className="size-4" aria-hidden />Ver a biblioteca</Link>}
                  {hasFilter && <Button variant="secondary" size="sm" onClick={handleClearFilters}><X className="size-4" aria-hidden />Limpar filtros</Button>}
                </motion.div>
              ) : view.view === 'grid' ? (
                <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout" initial>
                    {t.filtered.map(({ template, copies }, i) => <TemplateCard key={template.id} template={template} copies={copies} index={i} {...cardProps} />)}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.ul layout className="space-y-2">
                  <AnimatePresence mode="popLayout" initial>
                    {t.filtered.map(({ template, copies }, i) => <TemplateRow key={template.id} template={template} copies={copies} index={i} {...cardProps} />)}
                  </AnimatePresence>
                </motion.ul>
              )}
            </section>
          </div>
        </LayoutGroup>

        {isCreateOpen && <TemplateFormDialog title="Novo modelo" submitLabel="Criar modelo" onClose={() => setIsCreateOpen(false)} onSubmit={t.handleCreate} />}
        {toPreview && <LibraryPreviewDialog template={toPreview} canUse={canWrite} onUse={t.handleUse} onClose={() => setToPreview(null)} />}
        {toDelete && (
          <ConfirmDialog
            title="Excluir modelo"
            description={`"${toDelete.name}" deixará de aparecer na lista. Esta ação não pode ser desfeita pela interface.`}
            confirmLabel="Excluir"
            onCancel={() => setToDelete(null)}
            onConfirm={async () => {
              await t.handleArchive(toDelete.id)
              setToDelete(null)
            }}
          />
        )}
      </div>
    </MotionConfig>
  )
}
