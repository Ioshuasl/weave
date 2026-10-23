import { describe, expect, it } from 'vitest'
import { assertValidAvatar, detectAvatarType } from '../src/modules/identity/domain/avatar-validation'
import { ChangePasswordUseCase, UpdateProfileUseCase, UploadAvatarUseCase } from '../src/modules/identity/application/profile.use-cases'
import { updateProfileSchema } from '../src/modules/identity/presentation/identity.schemas'

const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)])
const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)])

describe('avatar', () => {
  it('detecta o formato pelo cabeçalho e recusa o resto', () => {
    expect(detectAvatarType(png)).toBe('image/png')
    expect(detectAvatarType(jpg)).toBe('image/jpeg')
    expect(() => assertValidAvatar(Buffer.from('<svg onload=alert(1)>'))).toThrow(/JPEG, PNG ou WebP/)
    expect(() => assertValidAvatar(Buffer.alloc(0))).toThrow()
    expect(() => assertValidAvatar(Buffer.concat([png, Buffer.alloc(2 * 1024 * 1024)]))).toThrow(/2 MB/)
  })

  it('grava com nome aleatório e apaga a foto anterior', async () => {
    const saved: string[] = []
    const removed: string[] = []
    const users: any = { setAvatarFile: async () => 'antiga.png' }
    const storage = { save: async (f: string) => void saved.push(f), remove: async (f: string) => void removed.push(f) }
    const { file } = await new UploadAvatarUseCase(users, storage).execute({ userId: 'u', content: png })
    expect(file).toMatch(/^[\w-]{20,}\.png$/)
    expect(saved).toEqual([file])
    expect(removed).toEqual(['antiga.png'])
  })
})

describe('perfil', () => {
  it('normaliza campos vazios e valida usuário/site', () => {
    const ok = updateProfileSchema.parse({ username: 'Alex.Morgan', jobRole: '  ', website: 'alexmorgan.dev', bio: '' })
    expect(ok).toMatchObject({ username: 'alex.morgan', jobRole: null, website: 'alexmorgan.dev', bio: null })
    expect(() => updateProfileSchema.parse({ username: 'a b' })).toThrow()
    expect(() => updateProfileSchema.parse({ timezone: 'Marte/Olimpo' })).toThrow()
  })

  it('recusa usuário já em uso', async () => {
    const users: any = { isUsernameTaken: async () => true, updateProfile: async () => {} }
    await expect(new UpdateProfileUseCase(users).execute({ userId: 'u', username: 'x1' })).rejects.toMatchObject({ status: 409 })
  })
})

describe('troca de senha', () => {
  const hasher = { hash: async (p: string) => `h:${p}`, verify: async (h: string, p: string) => h === `h:${p}` }
  const make = () => {
    const state = { updated: '', revoked: false }
    const users: any = { findPasswordHash: async () => 'h:antiga123', updatePasswordHash: async (_: string, h: string) => void (state.updated = h) }
    const sessions: any = { revokeAllForUser: async () => void (state.revoked = true) }
    const start: any = { execute: async () => ({ accessToken: 'a', refreshToken: 'r', refreshExpiresAt: new Date(), mustChangePassword: false }) }
    return { state, uc: new ChangePasswordUseCase(users, sessions, hasher, start) }
  }

  it('exige a senha atual, grava o hash novo e encerra as sessões', async () => {
    const { uc, state } = make()
    await expect(uc.execute({ userId: 'u', currentPassword: 'errada', newPassword: 'nova12345' })).rejects.toMatchObject({ code: 'WRONG_PASSWORD' })
    await expect(uc.execute({ userId: 'u', currentPassword: 'antiga123', newPassword: 'antiga123' })).rejects.toMatchObject({ code: 'SAME_PASSWORD' })
    const tokens = await uc.execute({ userId: 'u', currentPassword: 'antiga123', newPassword: 'nova12345' })
    expect(state).toEqual({ updated: 'h:nova12345', revoked: true })
    expect(tokens.accessToken).toBe('a')
  })
})
