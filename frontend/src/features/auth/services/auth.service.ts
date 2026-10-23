import { api } from '@/shared/lib/api'
import type { LoginFormValues, RegisterFormValues } from '../schemas/auth.schemas'
import type { UserProfile } from '../types'

export const authService = {
  login: (data: LoginFormValues) => api<{ accessToken: string; mustChangePassword: boolean }>('/auth/login', { method: 'POST', body: data }),
  register: (data: RegisterFormValues) =>
    api<{ accessToken: string; accountId: string }>('/auth/register', {
      method: 'POST',
      body: {
        ...data,
        accountName: data.accountType === 'COMPANY' ? data.accountName : undefined,
        segment: data.segment || undefined,
        document: data.document ? data.document.replace(/\D/g, '') : undefined,
      },
    }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  me: () => api<UserProfile>('/me'),
}
