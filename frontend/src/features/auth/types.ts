import type { AccountTypeEnum } from '@/shared/enums/AccountTypeEnum'
import type { AccountSegmentEnum } from '@/shared/enums/AccountSegmentEnum'
import type { MemberRoleEnum } from '@/shared/enums/MemberRoleEnum'

export interface Membership {
  accountId: string
  accountName: string
  accountType: AccountTypeEnum
  /** ramo de atuação informado no cadastro (opcional) */
  accountSegment: AccountSegmentEnum | null
  role: MemberRoleEnum
}

export interface UserProfile {
  id: string
  email: string
  name: string
  platformRole: 'USER' | 'SUPPORT'
  /** senha provisória ainda não trocada: o app só mostra a tela de definir a senha */
  mustChangePassword: boolean
  username: string | null
  jobRole: string | null
  timezone: string
  website: string | null
  bio: string | null
  /** caminho relativo na API (ex.: /avatars/x.jpg) — use `avatarSrc` */
  avatarUrl: string | null
  memberships: Membership[]
}
