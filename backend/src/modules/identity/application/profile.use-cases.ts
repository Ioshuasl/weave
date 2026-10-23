import { randomBytes } from 'node:crypto'
import { AppError, unauthorized } from '../../../shared/errors/app-error'
import { hashToken } from '../../../shared/security/token-hash'
import { assertValidAvatar } from '../domain/avatar-validation'
import type {
  ActiveSession,
  AvatarStorage,
  PasswordHasher,
  ProfileUpdate,
  SessionRepository,
  SessionTokens,
  UserRepository,
} from '../domain/ports'
import type { StartSessionUseCase } from './start-session.use-case'

export class UpdateProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(data: { userId: string } & ProfileUpdate): Promise<void> {
    const { userId, ...changes } = data
    if (changes.username && (await this.users.isUsernameTaken(changes.username, userId))) {
      throw new AppError('USERNAME_TAKEN', 'Este nome de usuário já está em uso.', 409)
    }
    await this.users.updateProfile(userId, changes)
  }
}

export class UploadAvatarUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly storage: AvatarStorage,
  ) {}

  async execute(data: { userId: string; content: Buffer }): Promise<{ file: string }> {
    const { extension } = assertValidAvatar(data.content)
    // nome aleatório: a URL pública não é adivinhável e troca a cada upload (evita cache antigo)
    const file = `${randomBytes(18).toString('base64url')}.${extension}`
    await this.storage.save(file, data.content)
    const previous = await this.users.setAvatarFile(data.userId, file)
    if (previous) await this.storage.remove(previous)
    return { file }
  }
}

export class RemoveAvatarUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly storage: AvatarStorage,
  ) {}

  async execute(data: { userId: string }): Promise<void> {
    const previous = await this.users.setAvatarFile(data.userId, null)
    if (previous) await this.storage.remove(previous)
  }
}

export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly startSession: StartSessionUseCase,
  ) {}

  /** Troca a senha, encerra todas as sessões e devolve uma sessão nova para este dispositivo. */
  async execute(data: { userId: string; currentPassword: string; newPassword: string; userAgent?: string; ip?: string }): Promise<SessionTokens> {
    const hash = await this.users.findPasswordHash(data.userId)
    if (!hash) throw unauthorized()
    if (!(await this.hasher.verify(hash, data.currentPassword))) {
      throw new AppError('WRONG_PASSWORD', 'A senha atual está incorreta.', 422)
    }
    if (data.currentPassword === data.newPassword) {
      throw new AppError('SAME_PASSWORD', 'A nova senha deve ser diferente da atual.', 422)
    }
    await this.users.updatePasswordHash(data.userId, await this.hasher.hash(data.newPassword))
    await this.sessions.revokeAllForUser(data.userId)
    return this.startSession.execute({ userId: data.userId, userAgent: data.userAgent, ip: data.ip })
  }
}

export interface SessionView extends Omit<ActiveSession, 'tokenHash'> {
  current: boolean
}

export class ListSessionsUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(data: { userId: string; currentRefreshToken?: string }): Promise<SessionView[]> {
    const currentHash = data.currentRefreshToken ? hashToken(data.currentRefreshToken) : null
    const active = await this.sessions.listActive(data.userId)
    return active.map(({ tokenHash, ...s }) => ({ ...s, current: tokenHash === currentHash }))
  }
}

export class RevokeSessionUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(data: { userId: string; sessionId: string }): Promise<void> {
    if (!(await this.sessions.revokeOwned(data.userId, data.sessionId))) throw new AppError('NOT_FOUND', 'Sessão não encontrada', 404)
  }
}
