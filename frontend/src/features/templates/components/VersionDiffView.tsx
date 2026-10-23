import { Minus, Pencil, Plus } from 'lucide-react'
import type { VersionDiff } from '../types'

const FIELD_LABEL: Record<string, string> = {
  content: 'texto',
  name: 'nome',
  'style.fontSize': 'tamanho da letra',
  'style.fontWeight': 'negrito',
  'style.color': 'cor do texto',
  'style.textAlign': 'alinhamento',
  'rect.x': 'posição',
  'rect.y': 'posição',
  'rect.width': 'largura',
  'rect.height': 'altura',
}

const TARGET_LABEL = { component: 'Elemento', band: 'Bloco', page: 'Página' } as const
const fieldLabel = (f: string) => FIELD_LABEL[f] ?? f.replace(/^style\./, 'estilo: ').replace(/^rect\./, 'posição: ')

/** O que mudou nesta versão, em linguagem simples. */
export const VersionDiffView = ({ diff }: { diff: VersionDiff }) => {
  if (diff.changes.length === 0) return <p className="text-sm text-fg-muted">Nada mudou na estrutura em relação à versão anterior.</p>
  return (
    <div className="flex flex-col gap-2">
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
        {diff.added > 0 && <span className="text-success">{diff.added} adicionado{diff.added > 1 ? 's' : ''}</span>}
        {diff.changed > 0 && <span className="text-info">{diff.changed} alterado{diff.changed > 1 ? 's' : ''}</span>}
        {diff.removed > 0 && <span className="text-destructive">{diff.removed} removido{diff.removed > 1 ? 's' : ''}</span>}
      </p>
      <ul className="space-y-1.5" aria-label="Mudanças desta versão">
        {diff.changes.map((c) => {
          const Icon = c.kind === 'added' ? Plus : c.kind === 'removed' ? Minus : Pencil
          const tone = c.kind === 'added' ? 'bg-success-subtle text-success' : c.kind === 'removed' ? 'bg-destructive-subtle text-destructive' : 'bg-info-subtle text-info'
          const verb = c.kind === 'added' ? 'adicionado' : c.kind === 'removed' ? 'removido' : 'alterado'
          return (
            <li key={`${c.target}-${c.id}-${c.kind}`} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="size-3" aria-hidden /></span>
              <span>
                <span className="font-medium">{TARGET_LABEL[c.target]} “{c.name}”</span> {verb}
                {c.fields.length > 0 && <span className="text-fg-muted"> — {[...new Set(c.fields.map(fieldLabel))].join(', ')}</span>}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
