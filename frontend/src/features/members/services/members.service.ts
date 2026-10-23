import { api } from '@/shared/lib/api'
import type { InvitationPreview, Member, MembersOverview } from '../types'
import type { CreateMemberFormValues, InviteFormValues } from '../schemas/members.schemas'

type AssignableRole = InviteFormValues['role']

export const membersService = {
  list: () => api<MembersOverview>('/members', { tenant: true }),
  createWithPassword: (data: CreateMemberFormValues) => api<Member>('/members', { method: 'POST', body: data, tenant: true }),
  resetPassword: (id: string, temporaryPassword: string) =>
    api(`/members/${id}/reset-password`, { method: 'POST', body: { temporaryPassword }, tenant: true }),
  invite: (data: InviteFormValues) => api('/members/invitations', { method: 'POST', body: data, tenant: true }),
  revokeInvitation: (id: string) => api(`/members/invitations/${id}`, { method: 'DELETE', tenant: true }),
  changeRole: (id: string, role: AssignableRole) =>
    api(`/members/${id}/role`, { method: 'PATCH', body: { role }, tenant: true }),
  remove: (id: string) => api(`/members/${id}`, { method: 'DELETE', tenant: true }),
  previewInvitation: (token: string) => api<InvitationPreview>(`/invitations/${token}`),
  acceptInvitation: (token: string, body: { name?: string; password?: string }) =>
    api<{ accountId: string; accessToken?: string }>(`/invitations/${token}/accept`, { method: 'POST', body }),
}
