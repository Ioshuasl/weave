import type { UserProfile } from '@/features/auth/types'
import { api } from '@/shared/lib/api'
import type { PasswordFormValues, ProfileFormValues } from '../schemas/settings.schemas'

export interface ActiveSession {
  id: string
  userAgent: string | null
  ip: string | null
  createdAt: string
  current: boolean
}

export const settingsService = {
  updateProfile: (v: ProfileFormValues) => api<UserProfile>('/me', { method: 'PATCH', body: v }),
  uploadAvatar: (blob: Blob) => api<UserProfile>('/me/avatar', { method: 'PUT', blob }),
  removeAvatar: () => api('/me/avatar', { method: 'DELETE' }),
  changePassword: (v: PasswordFormValues) =>
    api<{ accessToken: string }>('/me/password', { method: 'POST', body: { currentPassword: v.currentPassword, newPassword: v.newPassword } }),
  sessions: () => api<ActiveSession[]>('/auth/sessions'),
  revokeSession: (id: string) => api(`/auth/sessions/${id}`, { method: 'DELETE' }),
}
