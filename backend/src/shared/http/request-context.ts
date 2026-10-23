import type { MemberRole } from '@prisma/client'

export interface AuthContext {
  userId: string
}

export interface TenantContext extends AuthContext {
  accountId: string
  role: MemberRole
  /** Equipe de suporte da plataforma (platformRole = SUPPORT) */
  isSupport: boolean
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext
    tenant?: TenantContext
  }
}
