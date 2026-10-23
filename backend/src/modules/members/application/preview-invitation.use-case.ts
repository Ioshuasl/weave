import { AppError } from '../../../shared/errors/app-error'
import { hashToken } from '../../../shared/security/token-hash'
import type { InvitationRepository, UserDirectory } from '../domain/ports'

export class PreviewInvitationUseCase {
  constructor(
    private readonly invitations: InvitationRepository,
    private readonly users: UserDirectory,
  ) {}

  async execute(data: { token: string }) {
    const invitation = await this.invitations.findByTokenHash(hashToken(data.token))
    if (!invitation || invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      throw new AppError('INVITATION_INVALID', 'Convite inválido ou expirado', 410)
    }
    return {
      accountName: invitation.accountName,
      email: invitation.email,
      role: invitation.role,
      userExists: Boolean(await this.users.findByEmail(invitation.email)),
    }
  }
}
