import type { MemberRole } from '@prisma/client'
import { AppError, conflict, notFound } from '../../../shared/errors/app-error'
import { generateOpaqueToken, hashToken } from '../../../shared/security/token-hash'
import { assertCan } from '../../../shared/security/permissions'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCanManageMember } from '../domain/member-policy'
import type { InvitationRepository, InvitationView, MailSender, MemberRepository } from '../domain/ports'

const INVITATION_TTL_DAYS = 7

export class InviteMemberUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly invitations: InvitationRepository,
    private readonly mailer: MailSender,
    private readonly frontendUrl: string,
  ) {}

  async execute(data: { tenant: TenantContext; email: string; role: Exclude<MemberRole, 'OWNER'> }): Promise<InvitationView> {
    assertCan(data.tenant.role, 'members:invite')
    assertCanManageMember(data.tenant.role, 'EDITOR', data.role)
    const account = await this.members.getAccount(data.tenant.accountId)
    if (!account) throw notFound('Conta não encontrada')
    if (account.type !== 'COMPANY') {
      throw new AppError('PERSONAL_ACCOUNT', 'Contas de pessoa física não possuem funcionários', 422)
    }
    const email = data.email.toLowerCase()
    if (await this.members.isMember(data.tenant.accountId, email)) throw conflict('Este e-mail já faz parte da conta')

    const token = generateOpaqueToken()
    const invitation = await this.invitations.create({
      accountId: data.tenant.accountId,
      email,
      role: data.role,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
      invitedById: data.tenant.userId,
    })
    await this.mailer.sendInvitation({
      to: email,
      accountName: account.name,
      inviteUrl: `${this.frontendUrl}/convite/${token}`,
    })
    return invitation
  }
}
