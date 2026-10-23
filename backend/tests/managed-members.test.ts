import { describe, expect, it } from 'vitest'
import { StartSessionUseCase } from '../src/modules/identity/application/start-session.use-case'
import { JwtAccessTokenService } from '../src/modules/identity/infra/jwt-access-token.service'
import { makeAuthenticate } from '../src/modules/identity/presentation/authenticate.middleware'
import { CreateManagedMemberUseCase, ResetMemberPasswordUseCase } from '../src/modules/members/application/managed-members.use-cases'

const hasher = { hash: async (p: string) => `h:${p}`, verify: async () => true }
const tenant = (role: 'OWNER' | 'ADMIN' | 'EDITOR') => ({ userId: 'u', accountId: 'a1', role, isSupport: false })

const make = (over: { type?: 'COMPANY' | 'PERSONAL'; emailExists?: boolean; managed?: boolean; targetRole?: string } = {}) => {
  const created: any[] = []
  const reset: any[] = []
  const members: any = {
    getAccount: async () => ({ name: 'Acme', type: over.type ?? 'COMPANY' }),
    find: async () => ({ membershipId: 'm1', userId: 'u2', role: over.targetRole ?? 'EDITOR', managed: over.managed ?? true }),
  }
  const managed: any = {
    emailExists: async () => over.emailExists ?? false,
    createManaged: async (d: any) => (created.push(d), { membershipId: 'm1' }),
    resetManagedPassword: async (d: any) => (reset.push(d), true),
  }
  return { created, reset, create: new CreateManagedMemberUseCase(members, managed, hasher), resetUc: new ResetMemberPasswordUseCase(members, managed, hasher) }
}

describe('cadastro de funcionário com senha provisória', () => {
  it('cria com hash, e-mail minúsculo e validade de 7 dias', async () => {
    const { create, created } = make()
    await create.execute({ tenant: tenant('OWNER'), name: 'Ana', email: 'ANA@x.com', role: 'EDITOR', temporaryPassword: 'provisoria1' })
    expect(created[0]).toMatchObject({ email: 'ana@x.com', passwordHash: 'h:provisoria1', role: 'EDITOR' })
    const days = (created[0].expiresAt.getTime() - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(6.9)
    expect(days).toBeLessThan(7.1)
  })

  it('recusa e-mail que já tem conta (sem alterar a existente), conta PF, editor e admin criando admin', async () => {
    const input = { name: 'Ana', email: 'a@x.com', role: 'EDITOR' as const, temporaryPassword: 'provisoria1' }
    await expect(make({ emailExists: true }).create.execute({ tenant: tenant('OWNER'), ...input })).rejects.toMatchObject({ code: 'EMAIL_ALREADY_REGISTERED', status: 409 })
    await expect(make({ type: 'PERSONAL' }).create.execute({ tenant: tenant('OWNER'), ...input })).rejects.toMatchObject({ code: 'PERSONAL_ACCOUNT' })
    await expect(make().create.execute({ tenant: tenant('EDITOR'), ...input })).rejects.toMatchObject({ status: 403 })
    await expect(make().create.execute({ tenant: tenant('ADMIN'), ...input, role: 'ADMIN' })).rejects.toMatchObject({ status: 403 })
  })

  it('redefinir só vale para usuário cadastrado pela empresa e respeita hierarquia', async () => {
    await expect(make({ managed: false }).resetUc.execute({ tenant: tenant('OWNER'), membershipId: 'm1', temporaryPassword: 'nova12345' })).rejects.toMatchObject({ code: 'NOT_MANAGED' })
    await expect(make({ targetRole: 'ADMIN' }).resetUc.execute({ tenant: tenant('ADMIN'), membershipId: 'm1', temporaryPassword: 'nova12345' })).rejects.toMatchObject({ status: 403 })
    const ok = make()
    await ok.resetUc.execute({ tenant: tenant('OWNER'), membershipId: 'm1', temporaryPassword: 'nova12345' })
    expect(ok.reset[0]).toMatchObject({ accountId: 'a1', userId: 'u2', passwordHash: 'h:nova12345' })
  })
})

describe('senha provisória no login', () => {
  const tokens = new JwtAccessTokenService('x'.repeat(32), 15)
  const sessions: any = { create: async () => {} }
  const stateOf = (mustChangePassword: boolean, expiresInDays: number | null) =>
    new StartSessionUseCase(sessions, tokens, 30, {
      findSecurityState: async () => ({ mustChangePassword, tempPasswordExpiresAt: expiresInDays === null ? null : new Date(Date.now() + expiresInDays * 86_400_000) }),
    } as any)

  it('emite token restrito enquanto a senha for provisória', async () => {
    const r = await stateOf(true, 3).execute({ userId: 'u1' })
    expect(r.mustChangePassword).toBe(true)
    expect(tokens.verify(r.accessToken)).toEqual({ userId: 'u1', restricted: true })
    const normal = await stateOf(false, null).execute({ userId: 'u1' })
    expect(tokens.verify(normal.accessToken)).toEqual({ userId: 'u1', restricted: false })
  })

  it('senha provisória vencida não abre sessão', async () => {
    await expect(stateOf(true, -1).execute({ userId: 'u1' })).rejects.toMatchObject({ code: 'TEMP_PASSWORD_EXPIRED', status: 401 })
  })

  it('token restrito só passa nas rotas que o permitem', () => {
    const restricted = tokens.sign('u1', true)
    const run = (allow: boolean) => {
      let err: any
      makeAuthenticate(tokens, allow)({ headers: { authorization: `Bearer ${restricted}` } } as any, {} as any, (e?: unknown) => { err = e })
      return err
    }
    expect(run(false)).toMatchObject({ code: 'PASSWORD_CHANGE_REQUIRED', status: 403 })
    expect(run(true)).toBeUndefined()
  })
})
