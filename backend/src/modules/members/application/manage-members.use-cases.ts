import type { MemberRole } from '@prisma/client'
import { notFound } from '../../../shared/errors/app-error'
import { assertCan } from '../../../shared/security/permissions'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCanManageMember } from '../domain/member-policy'
import type { InvitationRepository, MemberRepository } from '../domain/ports'

export class ChangeMemberRoleUseCase {
  constructor(private readonly members: MemberRepository) {}

  async execute(data: { tenant: TenantContext; membershipId: string; role: Exclude<MemberRole, 'OWNER'> }): Promise<void> {
    assertCan(data.tenant.role, 'members:update-role')
    const target = await this.members.find(data.tenant.accountId, data.membershipId)
    if (!target) throw notFound('Membro não encontrado')
    assertCanManageMember(data.tenant.role, target.role, data.role)
    await this.members.updateRole(target.membershipId, data.role)
  }
}

export class RemoveMemberUseCase {
  constructor(private readonly members: MemberRepository) {}

  async execute(data: { tenant: TenantContext; membershipId: string }): Promise<void> {
    assertCan(data.tenant.role, 'members:remove')
    const target = await this.members.find(data.tenant.accountId, data.membershipId)
    if (!target) throw notFound('Membro não encontrado')
    assertCanManageMember(data.tenant.role, target.role)
    await this.members.remove(target.membershipId)
  }
}

export class RevokeInvitationUseCase {
  constructor(private readonly invitations: InvitationRepository) {}

  async execute(data: { tenant: TenantContext; invitationId: string }): Promise<void> {
    assertCan(data.tenant.role, 'members:invite')
    const revoked = await this.invitations.revoke(data.tenant.accountId, data.invitationId)
    if (!revoked) throw notFound('Convite não encontrado')
  }
}
