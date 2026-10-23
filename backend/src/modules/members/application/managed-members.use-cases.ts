import type { MemberRole } from '@prisma/client'
import { AppError, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCan } from '../../../shared/security/permissions'
import type { PasswordHasher } from '../../identity'
import { assertCanManageMember } from '../domain/member-policy'
import type { ManagedMemberRepository, MemberRepository, MemberView } from '../domain/ports'

/** A senha provisória vale por 7 dias; depois disso é preciso redefinir. */
export const TEMP_PASSWORD_TTL_DAYS = 7
const expiry = () => new Date(Date.now() + TEMP_PASSWORD_TTL_DAYS * 24 * 60 * 60 * 1000)

export class CreateManagedMemberUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly managed: ManagedMemberRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(data: {
    tenant: TenantContext
    name: string
    email: string
    role: Exclude<MemberRole, 'OWNER'>
    temporaryPassword: string
  }): Promise<MemberView> {
    assertCan(data.tenant.role, 'members:create-managed')
    assertCanManageMember(data.tenant.role, 'EDITOR', data.role)
    const account = await this.members.getAccount(data.tenant.accountId)
    if (!account) throw notFound('Conta não encontrada')
    if (account.type !== 'COMPANY') {
      throw new AppError('PERSONAL_ACCOUNT', 'Contas de pessoa física não possuem funcionários', 422)
    }
    const email = data.email.toLowerCase()
    // nunca mexe em conta existente: quem já tem login no Weave entra pelo convite por link
    if (await this.managed.emailExists(email)) {
      throw new AppError('EMAIL_ALREADY_REGISTERED', 'Este e-mail já tem conta no Weave. Use "Convidar por link" para adicioná-lo à empresa.', 409)
    }
    return this.managed.createManaged({
      accountId: data.tenant.accountId,
      name: data.name,
      email,
      passwordHash: await this.hasher.hash(data.temporaryPassword),
      role: data.role,
      expiresAt: expiry(),
    })
  }
}

export class ResetMemberPasswordUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly managed: ManagedMemberRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(data: { tenant: TenantContext; membershipId: string; temporaryPassword: string }): Promise<void> {
    assertCan(data.tenant.role, 'members:reset-password')
    const target = await this.members.find(data.tenant.accountId, data.membershipId)
    if (!target) throw notFound('Membro não encontrado')
    assertCanManageMember(data.tenant.role, target.role)
    if (!target.managed) {
      throw new AppError('NOT_MANAGED', 'Este usuário tem conta própria no Weave; a senha só pode ser alterada por ele.', 422)
    }
    const ok = await this.managed.resetManagedPassword({
      accountId: data.tenant.accountId,
      userId: target.userId,
      passwordHash: await this.hasher.hash(data.temporaryPassword),
      expiresAt: expiry(),
    })
    if (!ok) throw notFound('Membro não encontrado')
  }
}
