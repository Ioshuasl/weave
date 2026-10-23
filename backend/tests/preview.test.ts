import { describe, expect, it } from 'vitest'
import { SetTemplatePreviewUseCase } from '../src/modules/templates/application/preview.use-cases'

const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(20)])
const tenant = (role: 'EDITOR' | 'VIEWER', isSupport = false) => ({ userId: 'u', accountId: 'a1', role, isSupport })

const make = (over: { isSystem?: boolean; previewUrl?: string | null } = {}) => {
  const saved: string[] = []
  const removed: string[] = []
  const set: (string | null)[] = []
  const templates: any = {
    findVisible: async () => ({ id: 't1', isSystem: over.isSystem ?? false, previewUrl: over.previewUrl ?? null }),
    setPreviewFile: async (_: string, f: string | null) => (set.push(f), 'antiga.webp'),
  }
  const storage = { save: async (f: string) => void saved.push(f), remove: async (f: string) => void removed.push(f) }
  return { saved, removed, set, uc: new SetTemplatePreviewUseCase(templates, storage) }
}

describe('miniatura do modelo', () => {
  it('grava com nome aleatório e apaga a anterior', async () => {
    const { uc, saved, removed } = make({ previewUrl: '/previews/antiga.webp' })
    const r = await uc.execute({ tenant: tenant('EDITOR'), templateId: 't1', content: webp })
    expect(r.previewUrl).toMatch(/^\/previews\/[\w-]{20,}\.webp$/)
    expect(saved).toHaveLength(1)
    expect(removed).toEqual(['antiga.webp'])
  })

  it('viewer só envia se ainda não existir (geração sob demanda); depois só quem edita substitui', async () => {
    await expect(make().uc.execute({ tenant: tenant('VIEWER'), templateId: 't1', content: webp })).resolves.toBeTruthy()
    await expect(make({ previewUrl: '/previews/x.webp' }).uc.execute({ tenant: tenant('VIEWER'), templateId: 't1', content: webp })).rejects.toMatchObject({ status: 403 })
  })

  it('modelo pronto: qualquer membro gera a 1ª vez; só o suporte substitui', async () => {
    await expect(make({ isSystem: true }).uc.execute({ tenant: tenant('EDITOR'), templateId: 't1', content: webp })).resolves.toBeTruthy()
    await expect(make({ isSystem: true, previewUrl: '/previews/x.webp' }).uc.execute({ tenant: tenant('EDITOR'), templateId: 't1', content: webp })).rejects.toMatchObject({ status: 403 })
    await expect(make({ isSystem: true, previewUrl: '/previews/x.webp' }).uc.execute({ tenant: tenant('EDITOR', true), templateId: 't1', content: webp })).resolves.toBeTruthy()
  })

  it('recusa arquivo que não é imagem, vazio ou grande demais', async () => {
    const { uc } = make()
    await expect(uc.execute({ tenant: tenant('EDITOR'), templateId: 't1', content: Buffer.from('<svg onload=alert(1)>') })).rejects.toMatchObject({ code: 'PREVIEW_INVALID' })
    await expect(uc.execute({ tenant: tenant('EDITOR'), templateId: 't1', content: Buffer.alloc(0) })).rejects.toMatchObject({ code: 'PREVIEW_EMPTY' })
    await expect(uc.execute({ tenant: tenant('EDITOR'), templateId: 't1', content: Buffer.concat([webp, Buffer.alloc(1024 * 1024)]) })).rejects.toMatchObject({ code: 'PREVIEW_TOO_LARGE' })
  })
})
