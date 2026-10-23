import type { TagColorEnum } from '@/shared/enums/TagColorEnum'

export interface Tag {
  id: string
  name: string
  color: TagColorEnum
  /** tag do sistema (gerida pelo suporte, visível a todas as contas) */
  system: boolean
}
