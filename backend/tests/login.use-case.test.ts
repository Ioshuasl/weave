import { describe, expect, it } from 'vitest'
import { LoginUseCase } from '../src/modules/identity/application/login.use-case'
import { StartSessionUseCase } from '../src/modules/identity/application/start-session.use-case'
import { JwtAccessTokenService } from '../src/modules/identity/infra/jwt-access-token.service'

const hasher = { hash: async (p: string) => `h:${p}`, verify: async (h: string, p: string) => h === `h:${p}` }
const users: any = {
  findSecurityState: async () => ({ mustChangePassword: false, tempPasswordExpiresAt: null }),
  findCredentialsByEmail: async (email: string) =>
    email === 'a@b.com' ? { id: 'u1', email, name: 'A', passwordHash: 'h:secret123' } : null,
  findProfile: async () => null,
}
const created: string[] = []
const sessions: any = {
  create: async (d: { tokenHash: string }) => void created.push(d.tokenHash),
  findByTokenHash: async () => null,
  revoke: async () => {},
  revokeAllForUser: async () => {},
}
const tokens = new JwtAccessTokenService('x'.repeat(32), 15)
const login = new LoginUseCase(users, hasher, new StartSessionUseCase(sessions, tokens, 30, users))

describe('LoginUseCase', () => {
  it('emite sessão com credenciais válidas (token persistido só como hash)', async () => {
    const r = await login.execute({ email: 'A@B.com', password: 'secret123' })
    expect(tokens.verify(r.accessToken)?.userId).toBe('u1')
    expect(created[0]).not.toBe(r.refreshToken)
  })

  it('rejeita senha errada e e-mail inexistente com a mesma mensagem', async () => {
    await expect(login.execute({ email: 'a@b.com', password: 'x' })).rejects.toThrow('E-mail ou senha inválidos')
    await expect(login.execute({ email: 'z@b.com', password: 'x' })).rejects.toThrow('E-mail ou senha inválidos')
  })
})
