'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Braces, Plus, Table2, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { parseMockDataJson } from '../../schemas/mock-data.schemas'
import type { MockData, MockDataset } from '../../types'
import { DataTableEditor } from './DataTableEditor'

const STARTER: MockData = { cartorio: [{ nome: 'Cartório Exemplo' }], pessoas: [{ nome: 'Maria' }, { nome: 'João' }] }
const isValidSource = (name: string) => /^[\p{L}_][\p{L}\p{N}_]*$/u.test(name)

interface Props {
  dataset?: MockDataset
  onClose: () => void
  onSave: (body: { name: string; data: MockData }, datasetId?: string) => Promise<boolean>
}

/** Editor de um conjunto de dados de exemplo: uma tabela por fonte (modo simples) ou JSON (avançado). */
export const DatasetEditorDialog = ({ dataset, onClose, onSave }: Props) => {
  const [name, setName] = useState(dataset?.name ?? '')
  const [data, setData] = useState<MockData>(dataset?.data ?? STARTER)
  const [active, setActive] = useState(() => Object.keys(dataset?.data ?? STARTER)[0] ?? '')
  const [mode, setMode] = useState<'table' | 'json'>('table')
  const [jsonText, setJsonText] = useState('')
  const [newSource, setNewSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const sources = Object.keys(data)

  const handleRows = (rows: MockData[string]) => setData((d) => ({ ...d, [active]: rows }))

  const handleSwitchMode = (next: 'table' | 'json') => {
    setError(null)
    if (next === 'json') {
      setJsonText(JSON.stringify(data, null, 2))
    } else if (mode === 'json') {
      const parsed = parseMockDataJson(jsonText)
      if (!parsed.data) return setError(parsed.error ?? 'JSON inválido.')
      setData(parsed.data)
      if (!(active in parsed.data)) setActive(Object.keys(parsed.data)[0] ?? '')
    }
    setMode(next)
  }

  const handleAddSource = () => {
    const key = (newSource ?? '').trim()
    if (!isValidSource(key)) return setError('Use só letras, números e _ no nome da fonte (sem espaços), ex.: pessoas.')
    if (key in data) return setError('Já existe uma fonte com esse nome.')
    setError(null)
    setData((d) => ({ ...d, [key]: [{ campo_1: '' }] }))
    setActive(key)
    setNewSource(null)
  }

  const handleRemoveSource = (key: string) => {
    const { [key]: _omit, ...rest } = data
    setData(rest)
    if (active === key) setActive(Object.keys(rest)[0] ?? '')
  }

  const handleSubmit = async () => {
    if (name.trim().length < 2) return setError('Dê um nome ao conjunto, ex.: "Cliente de teste".')
    let finalData = data
    if (mode === 'json') {
      const parsed = parseMockDataJson(jsonText)
      if (!parsed.data) return setError(parsed.error ?? 'JSON inválido.')
      finalData = parsed.data
    }
    if (Object.keys(finalData).length === 0) return setError('Adicione ao menos uma fonte de dados.')
    setError(null)
    setIsSaving(true)
    const ok = await onSave({ name: name.trim(), data: finalData }, dataset?.id)
    setIsSaving(false)
    if (ok) onClose()
    else setError('Não foi possível salvar. Confira os dados e tente novamente.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="dataset-title">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="flex max-h-[94dvh] w-full max-w-4xl flex-col rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="dataset-title" className="text-md font-semibold">{dataset ? 'Editar dados de exemplo' : 'Novos dados de exemplo'}</h2>
            <p className="text-sm text-fg-secondary">Valores inventados só para você ver o relatório preenchido. Nada disso vai para o relatório final.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-48 flex-1">
              <label htmlFor="dataset-name" className="mb-1 block text-sm font-medium">Nome do conjunto</label>
              <input id="dataset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Cliente de teste" className="h-9 w-full rounded-md border border-input-border bg-surface px-3 text-base placeholder:text-placeholder hover:border-border-strong" />
            </div>
            <div role="tablist" aria-label="Modo de edição" className="flex rounded-md border border-border bg-surface-secondary p-0.5">
              {([['table', 'Tabela', Table2], ['json', 'Avançado (JSON)', Braces]] as const).map(([id, label, Icon]) => (
                <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => handleSwitchMode(id)} className={cn('relative flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm font-medium transition-colors', mode === id ? 'text-primary' : 'text-fg-muted hover:text-foreground')}>
                  {mode === id && <motion.span layoutId="dataset-mode" className="absolute inset-0 rounded-[5px] bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <Icon className="relative size-4" aria-hidden /><span className="relative">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {mode === 'table' ? (
              <motion.div key="table" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.16 }} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Fontes de dados">
                  {sources.map((s) => (
                    <div key={s} className={cn('group/src flex items-center rounded-md border text-sm transition-colors', s === active ? 'border-primary-border bg-primary-subtle text-primary' : 'border-border bg-surface hover:bg-surface-secondary')}>
                      <button type="button" role="tab" aria-selected={s === active} onClick={() => setActive(s)} className="h-8 px-3 font-medium">{s} <span className="text-xs font-normal text-fg-muted">· {data[s]?.length ?? 0}</span></button>
                      <button type="button" onClick={() => handleRemoveSource(s)} aria-label={`Remover a fonte ${s}`} className="mr-1 flex size-6 items-center justify-center rounded-sm text-fg-muted opacity-0 transition-opacity hover:bg-destructive-subtle hover:text-destructive focus-visible:opacity-100 group-hover/src:opacity-100 [@media(hover:none)]:opacity-100"><Trash2 className="size-3.5" aria-hidden /></button>
                    </div>
                  ))}
                  {newSource === null ? (
                    <button type="button" onClick={() => setNewSource('')} className="flex h-8 items-center gap-1 rounded-md border border-dashed border-border-strong px-3 text-sm text-fg-secondary transition-colors hover:border-primary-border hover:text-primary"><Plus className="size-4" aria-hidden />Nova fonte</button>
                  ) : (
                    <input autoFocus value={newSource} placeholder="nome_da_fonte" onChange={(e) => setNewSource(e.target.value)} onBlur={() => (newSource.trim() ? handleAddSource() : setNewSource(null))} onKeyDown={(e) => { if (e.key === 'Enter') handleAddSource(); if (e.key === 'Escape') setNewSource(null) }} aria-label="Nome da nova fonte" className="h-8 w-40 rounded-md border border-primary-border bg-surface px-2 font-mono text-xs" />
                  )}
                </div>
                {active && data[active] ? (
                  <>
                    <p className="text-xs text-fg-muted">Nos textos do relatório use <code className="rounded-sm bg-surface-secondary px-1 font-mono">{`{${active}.campo}`}</code> — copie pelo ícone ao lado de cada campo.</p>
                    <DataTableEditor key={active} source={active} rows={data[active]} onChange={handleRows} />
                  </>
                ) : (
                  <p className="rounded-lg border border-dashed border-border-strong py-10 text-center text-sm text-fg-muted">Crie uma fonte de dados (ex.: <strong>pessoas</strong>) para começar.</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="json" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.16 }}>
                <textarea aria-label="Dados em JSON" value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck={false} rows={16} className="w-full rounded-md border border-input-border bg-surface p-3 font-mono text-xs hover:border-border-strong" />
                <p className="mt-1 text-xs text-fg-muted">Formato: {'{ "fonte": [ { "campo": "valor" } ] }'}. Ao voltar para “Tabela”, os dados são validados.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-surface-secondary px-5 py-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={isSaving} onClick={handleSubmit}>Salvar dados</Button>
        </footer>
      </motion.div>
    </div>
  )
}
