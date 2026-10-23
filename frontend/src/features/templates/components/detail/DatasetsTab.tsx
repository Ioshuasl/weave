'use client'

import { motion, type Variants } from 'framer-motion'
import { Database, Eye, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { RelativeTime } from '@/shared/ui/RelativeTime'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useMockDatasetsHook } from '../../hooks/useMockDatasetsHook'
import type { MockDataset } from '../../types'
import { DatasetEditorDialog } from './DatasetEditorDialog'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring', stiffness: 260, damping: 24 } }),
  hover: { y: -3, transition: { type: 'spring', stiffness: 320, damping: 22 } },
}

export const DatasetsTab = ({ templateId, canEdit }: { templateId: string; canEdit: boolean }) => {
  const m = useMockDatasetsHook(templateId)
  const [editing, setEditing] = useState<MockDataset | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<MockDataset | null>(null)

  useEffect(() => {
    m.executeLoad()
  }, [m.executeLoad])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">Dados de exemplo</h2>
        <p className="text-sm text-fg-secondary">Cadastre pessoas, valores e datas inventados para ver o relatório preenchido antes de usar de verdade. Você pode ter vários conjuntos e escolher qual testar.</p>
      </div>

      {m.errorMessage && <Alert>{m.errorMessage}</Alert>}

      {m.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {m.datasets.map((d, i) => {
            const entries = Object.entries(d.data)
            return (
              <motion.article key={d.id} custom={i} variants={itemVariants} initial="hidden" animate="visible" whileHover="hover" className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary-border">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary"><Database className="size-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex flex-wrap items-center gap-2 text-md font-medium">{d.name}{d.isDefault && <Badge tone="primary"><Star className="mr-1 size-3 fill-current" aria-hidden />Padrão</Badge>}</h3>
                    <p className="text-xs text-fg-muted"><RelativeTime value={d.updatedAt} prefix="Atualizado" /></p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="Fontes de dados">
                  {entries.length === 0 ? <span className="text-sm text-fg-muted">Vazio</span> : entries.map(([source, rows]) => (
                    <span key={source} className="rounded-sm bg-surface-secondary px-2 py-0.5 text-xs text-fg-secondary"><span className="font-mono">{source}</span> · {rows.length} {rows.length === 1 ? 'linha' : 'linhas'}</span>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                  <Link href={`/editor/${templateId}?mode=preview&dataset=${d.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-sm font-medium transition-colors hover:bg-surface-secondary"><Eye className="size-4" aria-hidden />Testar</Link>
                  {canEdit && (
                    <>
                      <Button variant="secondary" size="sm" className="h-8" onClick={() => setEditing(d)}><Pencil className="size-4" aria-hidden />Editar</Button>
                      {!d.isDefault && <Button variant="ghost" size="sm" className="h-8" onClick={() => m.handleSetDefault(d.id)} title="Usar este conjunto por padrão"><Star className="size-4" aria-hidden />Tornar padrão</Button>}
                      <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={() => setToDelete(d)} aria-label={`Excluir ${d.name}`}><Trash2 className="size-4" aria-hidden /></Button>
                    </>
                  )}
                </div>
              </motion.article>
            )
          })}

          {canEdit && (
            <motion.button type="button" custom={m.datasets.length} variants={itemVariants} initial="hidden" animate="visible" whileHover={{ y: -3 }} onClick={() => setEditing('new')} className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-fg-secondary transition-colors hover:border-primary-border hover:bg-primary-subtle hover:text-primary">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-secondary"><Plus className="size-5" aria-hidden /></span>
              <span className="text-sm font-medium">Novo conjunto de dados</span>
              <span className="text-xs text-fg-muted">{m.datasets.length === 0 ? 'Comece por aqui para testar o relatório' : 'Ex.: outro cliente, outro cenário'}</span>
            </motion.button>
          )}
          {!canEdit && m.datasets.length === 0 && <p className="text-sm text-fg-muted">Este modelo ainda não tem dados de exemplo.</p>}
        </div>
      )}

      {editing && <DatasetEditorDialog dataset={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSave={m.handleSave} />}
      {toDelete && (
        <ConfirmDialog
          title="Excluir dados de exemplo"
          description={`O conjunto "${toDelete.name}" será excluído. O relatório em si não muda.`}
          confirmLabel="Excluir"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await m.handleDelete(toDelete.id)
            setToDelete(null)
          }}
        />
      )}
    </div>
  )
}
