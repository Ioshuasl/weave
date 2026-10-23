'use client'

import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { ArrowLeft, Database, History, Lock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { SharingBar } from '@/features/sharing/components/SharingBar'
import { TagsInput } from '@/features/tags/components/TagsInput'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { InlineEditableText } from '@/shared/ui/InlineEditableText'
import { Skeleton } from '@/shared/ui/Skeleton'
import { TagBadge } from '@/shared/ui/TagBadge'
import { useTemplateDetailHook } from '../hooks/useTemplateDetailHook'
import { DatasetsTab } from './detail/DatasetsTab'
import { DetailTabs, type DetailTab } from './detail/DetailTabs'
import { HistoryTab } from './detail/HistoryTab'
import { PreviewPanel } from './detail/PreviewPanel'

type TabId = 'data' | 'history'

const DetailSkeleton = () => (
  <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
    <div className="space-y-3"><Skeleton className="h-[26rem]" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
    <div className="space-y-4"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-7 w-1/3" /><Skeleton className="mt-6 h-11" /><Skeleton className="h-40" /></div>
  </div>
)

export const TemplateDetail = ({ id }: { id: string }) => {
  const { activeMembership, user } = useAuth()
  const d = useTemplateDetailHook(id)
  const [tab, setTab] = useState<TabId>('data')
  const canWrite = activeMembership?.role !== undefined && activeMembership.role !== 'VIEWER'
  const isSupport = user?.platformRole === 'SUPPORT'
  const canEdit = canWrite && (!d.template?.isSystem || isSupport)

  useEffect(() => {
    d.executeLoad()
  }, [d.executeLoad])

  const tabs: DetailTab<TabId>[] = [
    { id: 'data', label: 'Dados de exemplo', icon: Database },
    { id: 'history', label: 'Histórico', icon: History, count: d.versions.length + d.interactions.length },
  ]

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <Link href="/" className="mb-5 inline-flex items-center gap-1 rounded-md text-sm text-fg-secondary transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />Meus modelos
        </Link>
        {d.errorMessage && <div className="mb-4"><Alert>{d.errorMessage}</Alert></div>}

        {d.isLoading ? (
          <DetailSkeleton />
        ) : (
          d.template && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
              <PreviewPanel template={d.template} canEdit={canEdit} canUse={canWrite} onUse={d.handleUse} onPreviewReady={d.handlePreviewReady} />

              <div className="min-w-0">
                <header className="flex flex-col gap-2">
                  {d.template.isSystem && (
                    <p className="flex items-center gap-2 text-sm text-fg-secondary">
                      <Badge tone="primary">Modelo pronto</Badge>
                      {!canEdit && <span className="flex items-center gap-1"><Lock className="size-3.5" aria-hidden />Somente leitura — use este modelo para criar a sua cópia.</span>}
                    </p>
                  )}
                  <h1 className="text-3xl font-semibold">
                    <InlineEditableText value={d.template.name} placeholder="Sem nome" ariaLabel="Nome do modelo" required maxLength={120} readOnly={!canEdit} onSave={(name) => d.handlePatch({ name })} />
                  </h1>
                  <p className="text-base text-fg-secondary">
                    <InlineEditableText value={d.template.description ?? ''} placeholder="Adicionar uma descrição…" ariaLabel="Descrição do modelo" multiline maxLength={500} readOnly={!canEdit} onSave={(description) => d.handlePatch({ description: description || null })} />
                  </p>
                  <div className="mt-1">
                    {canEdit ? (
                      <TagsInput variant="inline" label="Tags do modelo" system={d.template.isSystem} value={d.template.tags.map((t) => t.id)} onChange={(tagIds) => d.handlePatch({ tagIds })} />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">{d.template.tags.map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} />)}</div>
                    )}
                  </div>
                  {canEdit && !d.template.isSystem && <div className="mt-3"><SharingBar templateId={id} templateDescription={d.template.description} segment={activeMembership?.accountSegment ?? null} /></div>}
                </header>

                <div className="mt-8">
                  <DetailTabs tabs={tabs} value={tab} onChange={setTab} />
                  <div className="pt-6" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
                        {tab === 'data' ? (
                          <DatasetsTab templateId={id} canEdit={canEdit} />
                        ) : (
                          <HistoryTab versions={d.versions} interactions={d.interactions} currentVersion={d.template.currentVersion} diffs={d.diffs} canEdit={canEdit} onLoadDiff={d.handleLoadDiff} onRestore={d.handleRestore} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        )}
      </div>
    </MotionConfig>
  )
}
