import type { MemberRoleEnum } from '@/shared/enums/MemberRoleEnum'

export interface Member {
  membershipId: string
  userId: string
  name: string
  email: string
  role: MemberRoleEnum
  status: 'ACTIVE' | 'SUSPENDED'
  createdAt: string
  /** cadastrado pela empresa com senha provisória (a empresa pode redefinir a senha) */
  managed: boolean
  mustChangePassword: boolean
  tempPasswordExpiresAt: string | null
}

export interface Invitation {
  id: string
  email: string
  role: MemberRoleEnum
  expiresAt: string
  createdAt: string
}

export interface MembersOverview {
  members: Member[]
  invitations: Invitation[]
}

export interface InvitationPreview {
  accountName: string
  email: string
  role: MemberRoleEnum
  userExists: boolean
}
