import { Database } from 'lucide-react'
import type { MockData } from '../types'

const MAX_FIELDS = 10

/** Modelo de dados do relatório: cada fonte, quantos registros de exemplo ela tem e os campos disponíveis. */
export const DataModelSummary = ({ data }: { data: MockData }) => {
  const sources = Object.entries(data)
  if (sources.length === 0) return <p className="text-sm text-fg-muted">Este modelo não tem dados de exemplo.</p>
  return (
    <ul className="space-y-2">
      {sources.map(([name, rows]) => {
        const fields = Object.keys(rows[0] ?? {})
        return (
          <li key={name} className="rounded-lg border border-border bg-surface p-3">
            <p className="flex items-center justify-between gap-2 text-sm font-medium">
              <span className="flex min-w-0 items-center gap-1.5"><Database className="size-3.5 shrink-0 text-fg-muted" aria-hidden /><span className="truncate font-mono text-[13px]">{name}</span></span>
              <span className="shrink-0 text-xs font-normal text-fg-muted">{rows.length} {rows.length === 1 ? 'registro' : 'registros'}</span>
            </p>
            {fields.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-1">
                {fields.slice(0, MAX_FIELDS).map((field) => <span key={field} className="rounded-sm bg-surface-secondary px-1.5 py-0.5 font-mono text-[11px] text-fg-secondary">{field}</span>)}
                {fields.length > MAX_FIELDS && <span className="px-1 py-0.5 text-[11px] text-fg-muted">+{fields.length - MAX_FIELDS} campos</span>}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
