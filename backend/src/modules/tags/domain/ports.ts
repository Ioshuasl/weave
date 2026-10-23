import type { TagColor } from '@prisma/client'

export interface TagView {
  id: string
  name: string
  color: TagColor
  /** true = tag do sistema (mantida pelo suporte, visível para todas as contas) */
  system: boolean
}

export interface TagRepository {
  listVisible(accountId: string): Promise<TagView[]>
  find(tagId: string): Promise<(TagView & { accountId: string | null }) | null>
  /** Já existe tag com este nome (sem diferenciar maiúsculas) no mesmo escopo? Devolve a existente. */
  findByName(accountId: string | null, name: string): Promise<TagView | null>
  create(data: { accountId: string | null; name: string; color: TagColor }): Promise<TagView>
  update(tagId: string, data: { name?: string; color?: TagColor }): Promise<TagView>
  delete(tagId: string): Promise<void>
}
