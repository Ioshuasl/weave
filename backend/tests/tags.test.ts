import { describe, expect, it } from 'vitest'
import { CreateTagUseCase, DeleteTagUseCase, UpdateTagUseCase } from '../src/modules/tags/application/tags.use-cases'
import type { TagRepository, TagView } from '../src/modules/tags/domain/ports'

const editor = { userId: 'u', accountId: 'a1', role: 'EDITOR' as const, isSupport: false }
const viewer = { ...editor, role: 'VIEWER' as const }
const support = { ...editor, isSupport: true }

const make = () => {
  const store: (TagView & { accountId: string | null })[] = [
    { id: 'sys', name: 'Notariado', color: 'BLUE', system: true, accountId: null },
    { id: 'mine', name: 'Urgente', color: 'RED', system: false, accountId: 'a1' },
    { id: 'other', name: 'Alheia', color: 'GRAY', system: false, accountId: 'a2' },
  ]
  const repo: TagRepository = {
    listVisible: async () => [],
    find: async (id) => store.find((t) => t.id === id) ?? null,
    findByName: async (accountId, name) => store.find((t) => t.accountId === accountId && t.name.toLowerCase() === name.toLowerCase()) ?? null,
    create: async (d) => ({ id: 'new', name: d.name, color: d.color, system: d.accountId === null }),
    update: async (id, d) => ({ ...store.find((t) => t.id === id)!, ...d }),
    delete: async () => {},
  }
  return repo
}

describe('tags', () => {
  it('cria tag da conta com cor automática e recusa nome repetido (sem diferenciar maiúsculas)', async () => {
    const uc = new CreateTagUseCase(make())
    const tag = await uc.execute({ tenant: editor, name: 'Contratos' })
    expect(tag.system).toBe(false)
    expect(tag.color).not.toBe('DEFAULT')
    await expect(uc.execute({ tenant: editor, name: 'urgente' })).rejects.toMatchObject({ status: 409 })
    await expect(uc.execute({ tenant: viewer, name: 'X' })).rejects.toThrow()
  })

  it('tags do sistema só o suporte cria/edita/exclui', async () => {
    const repo = make()
    await expect(new CreateTagUseCase(repo).execute({ tenant: editor, name: 'Nova', system: true })).rejects.toMatchObject({ status: 403 })
    expect((await new CreateTagUseCase(repo).execute({ tenant: support, name: 'Nova', system: true })).system).toBe(true)
    await expect(new UpdateTagUseCase(repo).execute({ tenant: editor, tagId: 'sys', color: 'PINK' })).rejects.toMatchObject({ status: 403 })
    await expect(new DeleteTagUseCase(repo).execute({ tenant: support, tagId: 'sys' })).resolves.toBeUndefined()
  })

  it('não enxerga nem altera tag de outra conta', async () => {
    await expect(new UpdateTagUseCase(make()).execute({ tenant: editor, tagId: 'other', name: 'Z' })).rejects.toMatchObject({ status: 404 })
  })
})
