import type { ReportDefinition } from '@/packages/weave'

/** O documento salvo no modelo é um ReportDefinition do motor (modelos antigos/vazios podem não ser). */
export const isReportDefinition = (doc: unknown): doc is ReportDefinition => {
  const d = doc as Partial<ReportDefinition> | null
  if (!d || !Array.isArray(d.pages) || !d.bands || typeof d.bands !== 'object' || !d.components || typeof d.components !== 'object') return false
  return Object.values(d.bands).every((b) => Array.isArray((b as { components?: unknown }).components))
}
