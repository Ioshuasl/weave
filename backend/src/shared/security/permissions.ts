import type { MemberRole } from '@prisma/client'
import { forbidden } from '../errors/app-error'

export type Action =
  | 'account:update'
  | 'members:read'
  | 'members:invite'
  | 'members:update-role'
  | 'members:remove'
  | 'members:create-managed'
  | 'members:reset-password'
  | 'templates:read'
  | 'templates:write'

const matrix: Record<Action, MemberRole[]> = {
  'account:update': ['OWNER', 'ADMIN'],
  'members:read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'members:invite': ['OWNER', 'ADMIN'],
  'members:update-role': ['OWNER', 'ADMIN'],
  'members:remove': ['OWNER', 'ADMIN'],
  'members:create-managed': ['OWNER', 'ADMIN'],
  'members:reset-password': ['OWNER', 'ADMIN'],
  'templates:read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'templates:write': ['OWNER', 'ADMIN', 'EDITOR'],
}

export const can = (role: MemberRole, action: Action) => matrix[action].includes(role)

export const assertCan = (role: MemberRole, action: Action) => {
  if (!can(role, action)) throw forbidden()
}
