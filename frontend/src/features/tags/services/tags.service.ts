import { api } from '@/shared/lib/api'
import type { TagColorEnum } from '@/shared/enums/TagColorEnum'
import type { Tag } from '../types'

export const tagsService = {
  list: () => api<Tag[]>('/tags', { tenant: true }),
  create: (body: { name: string; color?: TagColorEnum; system?: boolean }) => api<Tag>('/tags', { method: 'POST', body, tenant: true }),
  update: (id: string, body: { name?: string; color?: TagColorEnum }) => api<Tag>(`/tags/${id}`, { method: 'PATCH', body, tenant: true }),
  remove: (id: string) => api(`/tags/${id}`, { method: 'DELETE', tenant: true }),
}
