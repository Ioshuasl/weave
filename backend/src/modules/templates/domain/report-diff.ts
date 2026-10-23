import type { ReportDocument } from './ports'

export interface ReportChange {
  kind: 'added' | 'removed' | 'changed'
  target: 'component' | 'band' | 'page'
  id: string
  name: string
  /** campos alterados (ex.: conteudo, estilo.fontSize) — só em `changed` */
  fields: string[]
}

export interface ReportDiff {
  added: number
  removed: number
  changed: number
  changes: ReportChange[]
}

type Dict = Record<string, unknown>
const asDict = (v: unknown): Dict => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Dict) : {})
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const labelOf = (item: Dict, fallback: string) => String(item.name || item.content || fallback).slice(0, 60)

const changedFields = (before: Dict, after: Dict, skip: string[] = []): string[] => {
  const fields: string[] = []
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (skip.includes(key) || same(before[key], after[key])) continue
    if (key === 'style' || key === 'rect') {
      const b = asDict(before[key])
      const a = asDict(after[key])
      for (const k of new Set([...Object.keys(b), ...Object.keys(a)])) if (!same(b[k], a[k])) fields.push(`${key}.${k}`)
    } else {
      fields.push(key)
    }
  }
  return fields
}

const diffMap = (target: ReportChange['target'], before: Dict, after: Dict, skip: string[] = []): ReportChange[] => {
  const out: ReportChange[] = []
  for (const [id, item] of Object.entries(after)) {
    const prev = before[id]
    if (prev === undefined) out.push({ kind: 'added', target, id, name: labelOf(asDict(item), id), fields: [] })
    else {
      const fields = changedFields(asDict(prev), asDict(item), skip)
      if (fields.length) out.push({ kind: 'changed', target, id, name: labelOf(asDict(item), id), fields })
    }
  }
  for (const [id, item] of Object.entries(before)) {
    if (after[id] === undefined) out.push({ kind: 'removed', target, id, name: labelOf(asDict(item), id), fields: [] })
  }
  return out
}

/** Compara dois ReportDefinition por id (componentes, bandas e páginas). Estruturas inesperadas viram vazio. */
export const diffReportDocuments = (before: ReportDocument, after: ReportDocument): ReportDiff => {
  const pagesOf = (d: ReportDocument) => Object.fromEntries((Array.isArray(d.pages) ? d.pages : []).map((p, i) => [String(asDict(p).id ?? i), p]))
  const changes = [
    ...diffMap('component', asDict(before.components), asDict(after.components), ['id']),
    // a lista de componentes da banda muda sempre que um componente entra/sai: já aparece como componente
    ...diffMap('band', asDict(before.bands), asDict(after.bands), ['id', 'components']),
    ...diffMap('page', pagesOf(before), pagesOf(after), ['id', 'bands']),
  ]
  return {
    added: changes.filter((c) => c.kind === 'added').length,
    removed: changes.filter((c) => c.kind === 'removed').length,
    changed: changes.filter((c) => c.kind === 'changed').length,
    changes,
  }
}
