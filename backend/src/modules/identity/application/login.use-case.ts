import { unauthorized } from '../../../shared/errors/app-error'
import type { PasswordHasher, SessionTokens, UserRepository } from '../domain/ports'
import type { StartSessionUseCase } from './start-session.use-case'

export interface LoginInput {
  email: string
  password: string
  userAgent?: string
  ip?: string
}

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly startSession: StartSessionUseCase,
  ) {}

  async execute(data: LoginInput): Promise<SessionTokens> {
    const user = await this.users.findCredentialsByEmail(data.email.toLowerCase())
    const valid = user ? await this.hasher.verify(user.passwordHash, data.password) : false
    if (!user || !valid) throw unauthorized('E-mail ou senha inválidos')
    return this.startSession.execute({ userId: user.id, userAgent: data.userAgent, ip: data.ip })
  }
}
