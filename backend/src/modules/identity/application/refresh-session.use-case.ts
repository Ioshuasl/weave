import { unauthorized } from '../../../shared/errors/app-error'
import { hashToken } from '../../../shared/security/token-hash'
import type { SessionRepository, SessionTokens } from '../domain/ports'
import type { StartSessionUseCase } from './start-session.use-case'

export interface RefreshSessionInput {
  refreshToken: string
  userAgent?: string
  ip?: string
}

export class RefreshSessionUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly startSession: StartSessionUseCase,
  ) {}

  async execute(data: RefreshSessionInput): Promise<SessionTokens> {
    const session = await this.sessions.findByTokenHash(hashToken(data.refreshToken))
    if (!session) throw unauthorized('Sessão inválida')
    if (session.revokedAt) {
      // reuso de token já rotacionado: derruba todas as sessões do usuário
      await this.sessions.revokeAllForUser(session.userId)
      throw unauthorized('Sessão inválida')
    }
    if (session.expiresAt < new Date()) throw unauthorized('Sessão expirada')
    await this.sessions.revoke(session.id)
    return this.startSession.execute({ userId: session.userId, userAgent: data.userAgent, ip: data.ip })
  }
}
