import { TagColor } from '@prisma/client'
import { conflict, forbidden, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCan } from '../../../shared/security/permissions'
import type { TagRepository, TagView } from '../domain/ports'

const PALETTE = Object.values(TagColor).filter((c) => c !== 'DEFAULT')

/** Cor inicial estável para a tag nova (o usuário pode trocar depois). */
const pickColor = (name: string): TagColor => {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]!
}

const loadManageable = async (tags: TagRepository, tenant: TenantContext, tagId: string) => {
  const tag = await tags.find(tagId)
  if (!tag || (tag.accountId !== null && tag.accountId !== tenant.accountId)) throw notFound('Tag não encontrada')
  if (tag.accountId === null) {
    if (!tenant.isSupport) throw forbidden('Tags do sistema só podem ser alteradas pela equipe de suporte')
  } else {
    assertCan(tenant.role, 'templates:write')
  }
  return tag
}

export class ListTagsUseCase {
  constructor(private readonly tags: TagRepository) {}

  execute(data: { tenant: TenantContext }): Promise<TagView[]> {
    assertCan(data.tenant.role, 'templates:read')
    return this.tags.listVisible(data.tenant.accountId)
  }
}

export class CreateTagUseCase {
  constructor(private readonly tags: TagRepository) {}

  async execute(data: { tenant: TenantContext; name: string; color?: TagColor; system?: boolean }): Promise<TagView> {
    assertCan(data.tenant.role, 'templates:write')
    if (data.system && !data.tenant.isSupport) throw forbidden('Tags do sistema só podem ser criadas pela equipe de suporte')
    const scope = data.system ? null : data.tenant.accountId
    if (await this.tags.findByName(scope, data.name)) throw conflict('Já existe uma tag com este nome')
    return this.tags.create({ accountId: scope, name: data.name, color: data.color ?? pickColor(data.name) })
  }
}

export class UpdateTagUseCase {
  constructor(private readonly tags: TagRepository) {}

  async execute(data: { tenant: TenantContext; tagId: string; name?: string; color?: TagColor }): Promise<TagView> {
    const tag = await loadManageable(this.tags, data.tenant, data.tagId)
    if (data.name) {
      const same = await this.tags.findByName(tag.accountId, data.name)
      if (same && same.id !== tag.id) throw conflict('Já existe uma tag com este nome')
    }
    return this.tags.update(tag.id, { name: data.name, color: data.color })
  }
}

export class DeleteTagUseCase {
  constructor(private readonly tags: TagRepository) {}

  async execute(data: { tenant: TenantContext; tagId: string }): Promise<void> {
    const tag = await loadManageable(this.tags, data.tenant, data.tagId)
    await this.tags.delete(tag.id)
  }
}
