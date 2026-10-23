import type { AssistantInteractionKindEnum } from '@/shared/enums/AssistantInteractionKindEnum'

export interface AssistantInteraction {
  id: string
  request: string
  message: string
  kind: AssistantInteractionKindEnum
  actionCount: number
  userName: string
  userAvatarUrl: string | null
  createdAt: string
}
