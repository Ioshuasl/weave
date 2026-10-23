import { describe, expect, it } from 'vitest'
import { assertCanManageMember } from '../src/modules/members/domain/member-policy'
import { can } from '../src/shared/security/permissions'

describe('permissions', () => {
  it('viewer e editor não convidam', () => {
    expect(can('VIEWER', 'members:invite')).toBe(false)
    expect(can('EDITOR', 'members:invite')).toBe(false)
    expect(can('ADMIN', 'members:invite')).toBe(true)
  })

  it('owner é intocável e só owner mexe em admin', () => {
    expect(() => assertCanManageMember('ADMIN', 'OWNER')).toThrow()
    expect(() => assertCanManageMember('ADMIN', 'ADMIN')).toThrow()
    expect(() => assertCanManageMember('ADMIN', 'EDITOR', 'ADMIN')).toThrow()
    expect(() => assertCanManageMember('OWNER', 'ADMIN', 'EDITOR')).not.toThrow()
  })
})
