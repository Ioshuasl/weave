import type { AccountType, MemberRole, MembershipStatus } from '@prisma/client'

export interface MemberView {
  membershipId: string
  userId: string
  name: string
  email: string
  role: MemberRole
  status: MembershipStatus
  createdAt: Date
  /** cadastrado pela empresa com senha provisória: só ela pode redefinir a senha */
  managed: boolean
  /** ainda não fez o primeiro acesso (senha provisória vigente) */
  mustChangePassword: boolean
  tempPasswordExpiresAt: Date | null
}

export interface InvitationView {
  id: string
  email: string
  role: MemberRole
  expiresAt: Date
  createdAt: Date
}

export interface InvitationRecord extends InvitationView {
  accountId: string
  accountName: string
  acceptedAt: Date | null
  revokedAt: Date | null
}

export interface MemberRepository {
  list(accountId: string): Promise<MemberView[]>
  find(accountId: string, membershipId: string): Promise<MemberView | null>
  updateRole(membershipId: string, role: MemberRole): Promise<void>
  remove(membershipId: string): Promise<void>
  isMember(accountId: string, email: string): Promise<boolean>
  getAccount(accountId: string): Promise<{ name: string; type: AccountType } | null>
}

export interface InvitationRepository {
  create(data: {
    accountId: string
    email: string
    role: MemberRole
    tokenHash: string
    expiresAt: Date
    invitedById: string
  }): Promise<InvitationView>
  listPending(accountId: string): Promise<InvitationView[]>
  findByTokenHash(tokenHash: string): Promise<InvitationRecord | null>
  revoke(accountId: string, invitationId: string): Promise<boolean>
  accept(data: { invitationId: string; accountId: string; userId: string; role: MemberRole }): Promise<void>
}

export interface UserDirectory {
  findByEmail(email: string): Promise<{ id: string } | null>
  findEmailById(userId: string): Promise<string | null>
  create(data: { name: string; email: string; passwordHash: string }): Promise<string>
}

export interface MailSender {
  sendInvitation(data: { to: string; accountName: string; inviteUrl: string }): Promise<void>
}

export interface ManagedMemberRepository {
  /** Cria usuário (senha provisória) + vínculo com a empresa numa única transação. */
  createManaged(data: {
    accountId: string
    name: string
    email: string
    passwordHash: string
    role: MemberRole
    expiresAt: Date
  }): Promise<MemberView>
  /** Redefine a senha provisória; só vale para usuário cadastrado por esta conta. Encerra as sessões dele. */
  resetManagedPassword(data: { accountId: string; userId: string; passwordHash: string; expiresAt: Date }): Promise<boolean>
  emailExists(email: string): Promise<boolean>
}
