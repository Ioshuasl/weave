import { assertCan } from '../../../shared/security/permissions'
import type { TenantContext } from '../../../shared/http/request-context'
import type { InvitationRepository, InvitationView, MemberRepository, MemberView } from '../domain/ports'

export class ListMembersUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly invitations: InvitationRepository,
  ) {}

  async execute(data: { tenant: TenantContext }): Promise<{ members: MemberView[]; invitations: InvitationView[] }> {
    assertCan(data.tenant.role, 'members:read')
    const members = await this.members.list(data.tenant.accountId)
    const invitations = data.tenant.role === 'OWNER' || data.tenant.role === 'ADMIN'
      ? await this.invitations.listPending(data.tenant.accountId)
      : []
    return { members, invitations }
  }
}
