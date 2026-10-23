import { generateOpaqueToken, hashToken } from '../../../shared/security/token-hash'
import { AppError } from '../../../shared/errors/app-error'
import type { AccessTokenService, SessionRepository, SessionTokens, UserRepository } from '../domain/ports'

export interface StartSessionInput {
  userId: string
  userAgent?: string
  ip?: string
}

export class StartSessionUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTtlDays: number,
    private readonly users: UserRepository,
  ) {}

  async execute(data: StartSessionInput): Promise<SessionTokens> {
    const state = await this.users.findSecurityState(data.userId)
    const mustChangePassword = state?.mustChangePassword ?? false
    if (mustChangePassword && state?.tempPasswordExpiresAt && state.tempPasswordExpiresAt < new Date()) {
      throw new AppError('TEMP_PASSWORD_EXPIRED', 'A senha provisória expirou. Peça ao administrador da empresa para redefinir.', 401)
    }
    const refreshToken = generateOpaqueToken()
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000)
    await this.sessions.create({
      userId: data.userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
      userAgent: data.userAgent,
      ip: data.ip,
    })
    return { accessToken: this.accessTokens.sign(data.userId, mustChangePassword), refreshToken, refreshExpiresAt, mustChangePassword }
  }
}
