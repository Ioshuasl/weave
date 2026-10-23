import type { AssistantRequest, AssistantResponse } from '@/packages/weave'
import { api } from '@/shared/lib/api'
import type { AssistantInteraction } from '../types'

export const assistantService = {
  status: () => api<{ enabled: boolean }>('/assistant/status'),
  send: (templateId: string, request: AssistantRequest) =>
    api<AssistantResponse>(`/templates/${templateId}/assistant`, { method: 'POST', body: request, tenant: true }),
  history: (templateId: string) => api<AssistantInteraction[]>(`/templates/${templateId}/assistant/history`, { tenant: true }),
}
