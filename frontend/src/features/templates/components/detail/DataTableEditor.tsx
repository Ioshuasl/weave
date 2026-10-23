'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { CopyButton } from './CopyButton'

type Row = Record<string, unknown>

const toText = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))

/** Mantém números como número quando o valor original era número (dados de exemplo costumam ter valores/quantidades). */
const fromText = (previous: unknown, text: string): unknown => {
  if (typeof previous === 'number' && text.trim() !== '' && !Number.isNaN(Number(text))) return Number(text)
  return text
}

const sanitizeKey = (raw: string) => raw.trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_]/gu, '')

export const columnsOf = (rows: Row[]) => [...new Set(rows.flatMap((r) => Object.keys(r)))]

interface Props {
  source: string
  rows: Row[]
  onChange: (rows: Row[]) => void
}

/** Editor em tabela de uma fonte de dados: colunas = campos, linhas = registros (como uma planilha simples). */
export const DataTableEditor = ({ source, rows, onChange }: Props) => {
  const columns = columnsOf(rows)
  const [renaming, setRenaming] = useState<{ column: string; draft: string } | null>(null)

  const handleCell = (rowIndex: number, column: string, text: string) =>
    onChange(rows.map((r, i) => (i === rowIndex ? { ...r, [column]: fromText(r[column], text) } : r)))

  const handleAddRow = () => onChange([...rows, Object.fromEntries(columns.map((c) => [c, '']))])
  const handleRemoveRow = (rowIndex: number) => onChange(rows.filter((_, i) => i !== rowIndex))

  const handleAddColumn = () => {
    let n = columns.length + 1
    while (columns.includes(`campo_${n}`)) n++
    const key = `campo_${n}`
    onChange((rows.length ? rows : [{}]).map((r) => ({ ...r, [key]: '' })))
    setRenaming({ column: key, draft: key })
  }

  const handleRemoveColumn = (column: string) =>
    onChange(rows.map(({ [column]: _omit, ...rest }) => rest))

  const handleCommitRename = () => {
    if (!renaming) return
    const next = sanitizeKey(renaming.draft)
    if (next && next !== renaming.column && !columns.includes(next)) {
      // renomeia preservando a ordem das colunas
      onChange(rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k === renaming.column ? next : k, v]))))
    }
    setRenaming(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-surface-secondary">
              <th className="w-10 border-b border-border" aria-label="Linha" />
              {columns.map((c) => (
                <th key={c} scope="col" className="group/col min-w-36 border-b border-l border-border px-2 py-1.5 text-left font-medium">
                  {renaming?.column === c ? (
                    <input
                      autoFocus
                      aria-label={`Nome do campo ${c}`}
                      value={renaming.draft}
                      onChange={(e) => setRenaming({ column: c, draft: e.target.value })}
                      onBlur={handleCommitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitRename()
                        if (e.key === 'Escape') setRenaming(null)
                      }}
                      className="h-7 w-full rounded-sm border border-primary-border bg-surface px-1.5 font-mono text-xs"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setRenaming({ column: c, draft: c })} title="Clique para renomear o campo" className="min-w-0 flex-1 truncate rounded-sm px-1 py-0.5 text-left font-mono text-xs hover:bg-surface-tertiary">{c}</button>
                      <CopyButton text={`{${source}.${c}}`} label={`Copiar {${source}.${c}} para usar nos textos`} />
                      <button type="button" onClick={() => handleRemoveColumn(c)} aria-label={`Remover o campo ${c}`} className="flex size-5 items-center justify-center rounded-sm text-fg-muted opacity-0 transition-opacity hover:bg-destructive-subtle hover:text-destructive focus-visible:opacity-100 group-hover/col:opacity-100 [@media(hover:none)]:opacity-100">
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  )}
                </th>
              ))}
              <th className="w-10 border-b border-l border-border">
                <button type="button" onClick={handleAddColumn} aria-label="Adicionar campo (coluna)" title="Adicionar campo" className="flex size-8 w-full items-center justify-center text-fg-muted transition-colors hover:bg-surface-tertiary hover:text-primary">
                  <Plus className="size-4" aria-hidden />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row, i) => (
                <motion.tr key={i} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="group/row border-b border-border last:border-b-0 hover:bg-surface-hover">
                  <td className="relative w-10 text-center text-xs text-fg-muted">
                    <span className="group-hover/row:invisible">{i + 1}</span>
                    <button type="button" onClick={() => handleRemoveRow(i)} aria-label={`Remover a linha ${i + 1}`} className="absolute inset-0 flex items-center justify-center text-fg-muted opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100">
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </td>
                  {columns.map((c) => (
                    <td key={c} className="border-l border-border p-0">
                      <input
                        value={toText(row[c])}
                        onChange={(e) => handleCell(i, c, e.target.value)}
                        aria-label={`${c}, linha ${i + 1}`}
                        className={cn('h-9 w-full bg-transparent px-2.5 text-sm outline-none transition-colors focus:bg-primary-subtle', typeof row[c] === 'number' && 'text-right font-mono text-xs')}
                      />
                    </td>
                  ))}
                  <td className="border-l border-border" />
                </motion.tr>
              ))}
            </AnimatePresence>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 2} className="px-3 py-6 text-center text-sm text-fg-muted">Nenhum registro ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleAddRow}><Plus className="size-4" aria-hidden />Adicionar linha</Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddColumn}><Plus className="size-4" aria-hidden />Adicionar campo</Button>
        </div>
        <p className="text-xs text-fg-muted">{rows.length <= 1 ? 'Uma linha = dado único (ex.: o cartório).' : `${rows.length} linhas = uma lista que se repete no relatório.`}</p>
      </div>
    </div>
  )
}
