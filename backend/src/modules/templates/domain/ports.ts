import type { TagColor, VersionSource } from '@prisma/client'

export type ReportDocument = Record<string, unknown>

export interface TemplateTagView {
  id: string
  name: string
  color: TagColor
  system: boolean
}

export interface PersonView {
  name: string
  avatarUrl: string | null
}

export interface TemplateSummary {
  id: string
  name: string
  description: string | null
  tags: TemplateTagView[]
  /** caminho relativo da miniatura (ex.: /previews/x.webp) ou null se ainda não gerada */
  previewUrl: string | null
  /** raiz da cadeia de cópias (para agrupar cópias do mesmo modelo na galeria) */
  originId: string | null
  isSystem: boolean
  currentVersion: number
  /** quem criou o modelo (null nos modelos do sistema) */
  createdBy: PersonView | null
  updatedAt: Date
}

export interface TemplateDetail extends TemplateSummary {
  document: ReportDocument
}

export interface VersionSummary {
  number: number
  changeSummary: string | null
  source: VersionSource
  authorName: string | null
  authorAvatarUrl: string | null
  createdAt: Date
}

export interface TemplateFilters {
  tagId?: string
  search?: string
}

export interface CreateTemplateData {
  /** null = modelo do sistema (pronto), mantido pelo suporte */
  accountId: string | null
  isSystem?: boolean
  originId?: string | null
  authorId: string
  name: string
  description?: string | null
  tagIds: string[]
  document: ReportDocument
  changeSummary?: string
  source?: VersionSource
}

export interface UpdateTemplateData {
  name?: string
  description?: string | null
  /** substitui o conjunto de tags quando presente */
  tagIds?: string[]
  /** quando presente, gera uma nova versão */
  document?: ReportDocument
  changeSummary?: string
  source?: VersionSource
  authorId: string
}

export interface TemplateRepository {
  list(accountId: string, filters: TemplateFilters): Promise<TemplateSummary[]>
  /** Modelo do sistema ou da conta; null se não existir/arquivado/de outra conta. */
  findVisible(accountId: string, templateId: string): Promise<TemplateDetail | null>
  create(data: CreateTemplateData): Promise<TemplateDetail>
  update(templateId: string, data: UpdateTemplateData): Promise<TemplateDetail>
  archive(templateId: string): Promise<void>
  /** grava o arquivo da miniatura; devolve o anterior (para apagar do storage) */
  setPreviewFile(templateId: string, file: string | null): Promise<string | null>
  listVersions(templateId: string): Promise<VersionSummary[]>
  findVersionDocument(templateId: string, number: number): Promise<ReportDocument | null>
  restoreVersion(templateId: string, number: number, authorId: string): Promise<TemplateDetail>
}

/** Datasets de uma "massa de dados": nome da fonte → linhas. */
export type MockData = Record<string, Record<string, unknown>[]>

export interface MockDatasetView {
  id: string
  name: string
  isDefault: boolean
  data: MockData
  updatedAt: Date
}

export interface MockDatasetRepository {
  list(templateId: string): Promise<MockDatasetView[]>
  find(templateId: string, id: string): Promise<MockDatasetView | null>
  create(templateId: string, data: { name: string; data: MockData; isDefault: boolean }): Promise<MockDatasetView>
  update(id: string, data: { name?: string; data?: MockData; isDefault?: boolean }): Promise<MockDatasetView>
  remove(id: string): Promise<void>
  copyAll(fromTemplateId: string, toTemplateId: string): Promise<void>
}

/** Porta para o módulo `tags`: confere se as tags podem ser usadas pela conta/modelo. */
export interface TagAccess {
  assertUsable(accountId: string, tagIds: string[], options: { systemOnly: boolean }): Promise<void>
}

export interface PreviewStorage {
  save(file: string, content: Buffer): Promise<void>
  remove(file: string): Promise<void>
}
