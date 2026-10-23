import type { AccountSegment, AccountType, MemberRole } from '@prisma/client'

export interface AccountView {
  id: string
  type: AccountType
  name: string
  document: string | null
}

export interface RegistrationData {
  name: string
  email: string
  passwordHash: string
  accountType: AccountType
  accountName: string
  document?: string
  segment?: AccountSegment
}

export interface AccountRepository {
  emailExists(email: string): Promise<boolean>
  createWithOwner(data: RegistrationData): Promise<{ userId: string; accountId: string }>
  findById(accountId: string): Promise<AccountView | null>
  update(accountId: string, data: { name?: string; document?: string | null }): Promise<AccountView>
  findActiveRole(accountId: string, userId: string): Promise<MemberRole | null>
  isSupport(userId: string): Promise<boolean>
}
