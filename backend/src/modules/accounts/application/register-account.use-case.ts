import type { AccountSegment, AccountType } from '@prisma/client'
import { conflict } from '../../../shared/errors/app-error'
import type { PasswordHasher, SessionTokens, StartSessionUseCase } from '../../identity'
import type { AccountRepository } from '../domain/ports'

export interface RegisterAccountInput {
  name: string
  email: string
  password: string
  accountType: AccountType
  accountName?: string
  document?: string
  segment?: AccountSegment
  userAgent?: string
  ip?: string
}

export class RegisterAccountUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly hasher: PasswordHasher,
    private readonly startSession: StartSessionUseCase,
  ) {}

  async execute(data: RegisterAccountInput): Promise<SessionTokens & { accountId: string }> {
    const email = data.email.toLowerCase()
    if (await this.accounts.emailExists(email)) throw conflict('Já existe uma conta com este e-mail')
    const { userId, accountId } = await this.accounts.createWithOwner({
      name: data.name,
      email,
      passwordHash: await this.hasher.hash(data.password),
      accountType: data.accountType,
      accountName: data.accountType === 'COMPANY' ? data.accountName! : data.name,
      document: data.document,
      segment: data.segment,
    })
    const tokens = await this.startSession.execute({ userId, userAgent: data.userAgent, ip: data.ip })
    return { ...tokens, accountId }
  }
}
