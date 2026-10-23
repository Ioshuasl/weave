import { describe, expect, it } from 'vitest'
import { ArchiveTemplateUseCase, UpdateTemplateUseCase } from '../src/modules/templates/application/templates.use-cases'
import type { TemplateRepository } from '../src/modules/templates/domain/ports'

const base = { id: 't1', name: 'N', description: null, tags: [], currentVersion: 1, updatedAt: new Date(), document: {} }
const repoWith = (isSystem: boolean) =>
  ({ findVisible: async () => ({ ...base, isSystem }), update: async () => ({ ...base, isSystem }), archive: async () => {} }) as unknown as TemplateRepository

const noTags = { assertUsable: async () => {} }
const editor = { userId: 'u', accountId: 'a', role: 'EDITOR' as const, isSupport: false }
const viewer = { ...editor, role: 'VIEWER' as const }

describe('templates', () => {
  it('modelo do sistema é somente leitura', async () => {
    await expect(new UpdateTemplateUseCase(repoWith(true), noTags).execute({ tenant: editor, templateId: 't1', name: 'x' })).rejects.toThrow(/somente leitura/)
    await expect(new ArchiveTemplateUseCase(repoWith(true)).execute({ tenant: editor, templateId: 't1' })).rejects.toThrow(/somente leitura/)
  })

  it('viewer não escreve; editor escreve em modelo da conta', async () => {
    await expect(new UpdateTemplateUseCase(repoWith(false), noTags).execute({ tenant: viewer, templateId: 't1', name: 'x' })).rejects.toThrow()
    await expect(new UpdateTemplateUseCase(repoWith(false), noTags).execute({ tenant: editor, templateId: 't1', name: 'xx' })).resolves.toBeTruthy()
  })
})
