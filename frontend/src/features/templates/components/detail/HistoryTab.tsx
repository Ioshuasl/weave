'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, FilePlus2, History, MessageSquare, Pencil, RotateCcw, Sparkles, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import type { AssistantInteraction } from '@/features/assistant/types'
import { dayKey, formatDayLabel } from '@/shared/actions/formatDayLabel'
import { AssistantInteractionKindLabel } from '@/shared/enums/AssistantInteractionKindEnum'
import { VersionSourceLabel } from '@/shared/enums/VersionSourceEnum'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { PersonChip } from '@/shared/ui/PersonChip'
import { RelativeTime } from '@/shared/ui/RelativeTime'
import { Skeleton } from '@/shared/ui/Skeleton'
import type { VersionDiff, VersionSummary } from '../../types'
import { VersionDiffView } from '../VersionDiffView'

type Filter = 'ALL' | 'EDITS' | 'AI'
type TimelineEvent = { kind: 'version'; at: string; version: VersionSummary } | { kind: 'assistant'; at: string; interaction: AssistantInteraction }

interface Props {
  versions: VersionSummary[]
  interactions: AssistantInteraction[]
  currentVersion: number
  diffs: Record<number, VersionDiff>
  canEdit: boolean
  onLoadDiff: (number: number) => void
  onRestore: (number: number) => Promise<void>
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'Tudo' },
  { id: 'EDITS', label: 'Edições' },
  { id: 'AI', label: 'Assistente de IA' },
]

const Node = ({ icon: Icon, tone }: { icon: LucideIcon; tone: string }) => (
  <span className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-surface ring-1 ring-border', tone)}><Icon className="size-4" aria-hidden /></span>
)

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: Math.min(i, 10) * 0.04, type: 'spring' as const, stiffness: 280, damping: 26 } }),
}

export const HistoryTab = ({ versions, interactions, currentVersion, diffs, canEdit, onLoadDiff, onRestore }: Props) => {
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [open, setOpen] = useState<number | null>(null)
  const [toRestore, setToRestore] = useState<number | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const tz = user?.timezone

  const events = useMemo<TimelineEvent[]>(() => {
    const all: TimelineEvent[] = [
      ...versions.map((version) => ({ kind: 'version' as const, at: version.createdAt, version })),
      ...interactions.map((interaction) => ({ kind: 'assistant' as const, at: interaction.createdAt, interaction })),
    ]
    return all
      .filter((e) => (filter === 'ALL' ? true : filter === 'AI' ? e.kind === 'assistant' || e.version.source === 'ASSISTANT' : e.kind === 'version' && e.version.source !== 'ASSISTANT'))
      .sort((a, b) => b.at.localeCompare(a.at))
  }, [versions, interactions, filter])

  const days = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>()
    for (const e of events) groups.set(dayKey(e.at, tz), [...(groups.get(dayKey(e.at, tz)) ?? []), e])
    return [...groups.values()]
  }, [events, tz])

  const counts = { ALL: versions.length + interactions.length, EDITS: versions.filter((v) => v.source !== 'ASSISTANT').length, AI: interactions.length + versions.filter((v) => v.source === 'ASSISTANT').length }

  const handleToggleDiff = (number: number) => {
    onLoadDiff(number)
    setOpen((cur) => (cur === number ? null : number))
  }

  const handleConfirmRestore = async () => {
    if (toRestore === null) return
    setIsRestoring(true)
    await onRestore(toRestore)
    setIsRestoring(false)
    setToRestore(null)
  }

  let index = 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Histórico</h2>
          <p className="text-sm text-fg-secondary">Tudo o que aconteceu neste modelo, do mais recente ao mais antigo. Você pode voltar a qualquer versão.</p>
        </div>
        <div role="radiogroup" aria-label="Filtrar histórico" className="flex gap-1 rounded-md border border-border bg-surface-secondary p-0.5">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={filter === f.id} onClick={() => setFilter(f.id)} className={cn('relative flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm font-medium transition-colors', filter === f.id ? 'text-primary' : 'text-fg-muted hover:text-foreground')}>
              {filter === f.id && <motion.span layoutId="history-filter" className="absolute inset-0 rounded-[5px] bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <span className="relative">{f.label}</span><span className="relative text-xs text-fg-muted">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {days.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong py-12 text-center text-sm text-fg-muted">Nada por aqui ainda.</p>
      ) : (
        days.map((group) => (
          <section key={dayKey(group[0]!.at, tz)} aria-label={formatDayLabel(group[0]!.at, Date.now(), tz)}>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-muted"><History className="size-3.5" aria-hidden />{formatDayLabel(group[0]!.at, Date.now(), tz)}</h3>
            <ol className="relative flex flex-col gap-4 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-border">
              {group.map((e) => {
                const i = index++
                if (e.kind === 'assistant') {
                  const it = e.interaction
                  return (
                    <motion.li key={`ai-${it.id}`} custom={i} variants={itemVariants} initial="hidden" animate="visible" className="relative flex gap-3">
                      <Node icon={MessageSquare} tone="bg-tag-purple/60 text-tag-purple-fg" />
                      <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface p-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted"><PersonChip name={it.userName} avatarUrl={it.userAvatarUrl} /> · <RelativeTime value={it.createdAt} /></div>
                        <p className="mt-2 w-fit max-w-full rounded-lg rounded-tl-sm bg-primary-subtle px-3 py-1.5 text-sm text-foreground">“{it.request}”</p>
                        <p className="mt-1.5 flex items-start gap-2 text-sm text-fg-secondary"><Sparkles className="mt-0.5 size-4 shrink-0 text-tag-purple-fg" aria-hidden />{it.message}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted"><Badge tone={it.kind === 'ACTIONS' ? 'primary' : 'neutral'}>{AssistantInteractionKindLabel[it.kind]}</Badge>{it.actionCount > 0 && <span>{it.actionCount} {it.actionCount === 1 ? 'alteração' : 'alterações'}</span>}</p>
                      </div>
                    </motion.li>
                  )
                }
                const v = e.version
                const isCurrent = v.number === currentVersion
                const isCreation = v.number === 1
                const icon = isCreation ? FilePlus2 : v.source === 'ASSISTANT' ? Sparkles : v.source === 'RESTORE' ? RotateCcw : Pencil
                const tone = isCreation ? 'bg-success-subtle text-success' : v.source === 'ASSISTANT' ? 'bg-tag-purple/60 text-tag-purple-fg' : v.source === 'RESTORE' ? 'bg-surface-tertiary text-fg-secondary' : 'bg-primary-subtle text-primary'
                const expanded = open === v.number
                return (
                  <motion.li key={`v-${v.number}`} custom={i} variants={itemVariants} initial="hidden" animate="visible" className="relative flex gap-3">
                    <Node icon={icon} tone={tone} />
                    <div className={cn('min-w-0 flex-1 rounded-xl border bg-surface p-3 transition-colors', isCurrent ? 'border-primary-border' : 'border-border')}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-base font-medium">{v.changeSummary ?? VersionSourceLabel[v.source]}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted"><PersonChip name={v.authorName} avatarUrl={v.authorAvatarUrl} /> · <RelativeTime value={v.createdAt} /> · {VersionSourceLabel[v.source]}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge tone={isCurrent ? 'success' : 'neutral'}>v{v.number}{isCurrent ? ' · atual' : ''}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {!isCreation && (
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleToggleDiff(v.number)} aria-expanded={expanded}>
                            O que mudou<ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden />
                          </Button>
                        )}
                        {canEdit && !isCurrent && (
                          <Button variant="secondary" size="sm" className="h-7" onClick={() => setToRestore(v.number)}><RotateCcw className="size-3.5" aria-hidden />Voltar para esta versão</Button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="mt-2 rounded-lg bg-surface-secondary p-3">
                              {diffs[v.number] ? <VersionDiffView diff={diffs[v.number]!} /> : <Skeleton className="h-10 w-full" />}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>
                )
              })}
            </ol>
          </section>
        ))
      )}

      {toRestore !== null && (
        <ConfirmDialog
          tone="primary"
          title={`Voltar para a versão ${toRestore}?`}
          description="O modelo volta a ficar como estava nessa versão. Nada se perde: o estado atual continua no histórico e você pode desfazer voltando para ele."
          confirmLabel="Voltar para esta versão"
          loading={isRestoring}
          onCancel={() => setToRestore(null)}
          onConfirm={handleConfirmRestore}
        />
      )}
    </div>
  )
}
