import { hashToken } from '../../../shared/security/token-hash'
import type { SessionRepository } from '../domain/ports'

export class LogoutUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(data: { refreshToken?: string }): Promise<void> {
    if (!data.refreshToken) return
    const session = await this.sessions.findByTokenHash(hashToken(data.refreshToken))
    if (session && !session.revokedAt) await this.sessions.revoke(session.id)
  }
}
