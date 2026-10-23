import type { Tag } from '@/features/tags/types'
import type { VersionSourceEnum } from '@/shared/enums/VersionSourceEnum'

export interface Person {
  name: string
  /** caminho relativo na API — use `avatarSrc` */
  avatarUrl: string | null
}

export interface TemplateSummary {
  id: string
  name: string
  description: string | null
  tags: Tag[]
  /** caminho relativo da miniatura (use `assetSrc`) ou null se ainda não foi gerada */
  previewUrl: string | null
  /** raiz da cadeia de cópias: cópias do mesmo modelo se agrupam na galeria */
  originId: string | null
  isSystem: boolean
  currentVersion: number
  /** quem criou o modelo (null nos modelos do sistema) */
  createdBy: Person | null
  updatedAt: string
}

export interface TemplateDetail extends TemplateSummary {
  document: Record<string, unknown>
}

export interface VersionSummary {
  number: number
  changeSummary: string | null
  source: VersionSourceEnum
  authorName: string | null
  authorAvatarUrl: string | null
  createdAt: string
}

export type MockData = Record<string, Record<string, unknown>[]>

export interface MockDataset {
  id: string
  name: string
  isDefault: boolean
  data: MockData
  updatedAt: string
}

export interface ReportChange {
  kind: 'added' | 'removed' | 'changed'
  target: 'component' | 'band' | 'page'
  id: string
  name: string
  fields: string[]
}

export interface VersionDiff {
  added: number
  removed: number
  changed: number
  changes: ReportChange[]
}

/** Uma entrada da galeria: o modelo mais recente de uma cadeia de cópias + as demais cópias dele. */
export interface TemplateGroup {
  template: TemplateSummary
  copies: TemplateSummary[]
}
