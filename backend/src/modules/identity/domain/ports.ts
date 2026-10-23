import type { AccountSegment, AccountType, MemberRole } from '@prisma/client'

export interface PasswordHasher {
  hash(plain: string): Promise<string>
  verify(hash: string, plain: string): Promise<boolean>
}

export interface AccessTokenService {
  /** `restricted`: senha provisória ainda não trocada — o token só serve para ver o perfil e trocar a senha */
  sign(userId: string, restricted?: boolean): string
  verify(token: string): { userId: string; restricted: boolean } | null
}

export interface UserCredentials {
  id: string
  email: string
  name: string
  passwordHash: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  platformRole: 'USER' | 'SUPPORT'
  mustChangePassword: boolean
  username: string | null
  jobRole: string | null
  timezone: string
  website: string | null
  bio: string | null
  /** nome do arquivo em storage; a URL pública é montada na apresentação */
  avatarFile: string | null
  memberships: {
    accountId: string
    accountName: string
    accountType: AccountType
    accountSegment: AccountSegment | null
    role: MemberRole
  }[]
}

export interface ProfileUpdate {
  name?: string
  username?: string | null
  jobRole?: string | null
  timezone?: string
  website?: string | null
  bio?: string | null
}

export interface UserRepository {
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>
  findProfile(userId: string): Promise<UserProfile | null>
  findPasswordHash(userId: string): Promise<string | null>
  findSecurityState(userId: string): Promise<{ mustChangePassword: boolean; tempPasswordExpiresAt: Date | null } | null>
  isUsernameTaken(username: string, exceptUserId: string): Promise<boolean>
  updateProfile(userId: string, data: ProfileUpdate): Promise<void>
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>
  /** devolve o arquivo anterior (para apagar do storage) */
  setAvatarFile(userId: string, file: string | null): Promise<string | null>
}

export interface AvatarStorage {
  save(file: string, content: Buffer): Promise<void>
  remove(file: string): Promise<void>
}

export interface SessionRecord {
  id: string
  userId: string
  expiresAt: Date
  revokedAt: Date | null
}

export interface SessionRepository {
  create(data: { userId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ip?: string }): Promise<void>
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>
  revoke(id: string): Promise<void>
  revokeAllForUser(userId: string): Promise<void>
  listActive(userId: string): Promise<ActiveSession[]>
  revokeOwned(userId: string, sessionId: string): Promise<boolean>
}

export interface ActiveSession {
  id: string
  tokenHash: string
  userAgent: string | null
  ip: string | null
  createdAt: Date
}

export interface SessionTokens {
  accessToken: string
  refreshToken: string
  refreshExpiresAt: Date
  /** senha provisória ainda não trocada: o token é restrito até a troca */
  mustChangePassword: boolean
}
