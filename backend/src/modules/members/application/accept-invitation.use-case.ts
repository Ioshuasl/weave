import { AppError, conflict, unauthorized } from '../../../shared/errors/app-error'
import { hashToken } from '../../../shared/security/token-hash'
import type { PasswordHasher, SessionTokens, StartSessionUseCase } from '../../identity'
import type { InvitationRepository, MemberRepository, UserDirectory } from '../domain/ports'

export interface AcceptInvitationInput {
  token: string
  authUserId?: string
  name?: string
  password?: string
  userAgent?: string
  ip?: string
}

export class AcceptInvitationUseCase {
  constructor(
    private readonly invitations: InvitationRepository,
    private readonly members: MemberRepository,
    private readonly users: UserDirectory,
    private readonly hasher: PasswordHasher,
    private readonly startSession: StartSessionUseCase,
  ) {}

  async execute(data: AcceptInvitationInput): Promise<{ accountId: string; tokens?: SessionTokens }> {
    const invitation = await this.invitations.findByTokenHash(hashToken(data.token))
    if (!invitation || invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      throw new AppError('INVITATION_INVALID', 'Convite inválido ou expirado', 410)
    }
    if (await this.members.isMember(invitation.accountId, invitation.email)) {
      throw conflict('Este e-mail já faz parte da conta')
    }

    const existing = await this.users.findByEmail(invitation.email)
    let userId: string
    let isNewUser = false
    if (existing) {
      if (data.authUserId !== existing.id) throw unauthorized('Entre com a conta do e-mail convidado para aceitar')
      userId = existing.id
    } else {
      if (!data.name || !data.password) {
        throw new AppError('VALIDATION_ERROR', 'Informe nome e senha para criar seu acesso', 422)
      }
      userId = await this.users.create({
        name: data.name,
        email: invitation.email,
        passwordHash: await this.hasher.hash(data.password),
      })
      isNewUser = true
    }

    await this.invitations.accept({
      invitationId: invitation.id,
      accountId: invitation.accountId,
      userId,
      role: invitation.role,
    })
    const tokens = isNewUser
      ? await this.startSession.execute({ userId, userAgent: data.userAgent, ip: data.ip })
      : undefined
    return { accountId: invitation.accountId, tokens }
  }
}
