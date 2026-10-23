import type { Request, Response } from 'express'
import { setRefreshCookie } from '../../identity'
import type { AcceptInvitationUseCase } from '../application/accept-invitation.use-case'
import type { InviteMemberUseCase } from '../application/invite-member.use-case'
import type { ListMembersUseCase } from '../application/list-members.use-case'
import type {
  ChangeMemberRoleUseCase,
  RemoveMemberUseCase,
  RevokeInvitationUseCase,
} from '../application/manage-members.use-cases'
import type { PreviewInvitationUseCase } from '../application/preview-invitation.use-case'
import type { CreateManagedMemberUseCase, ResetMemberPasswordUseCase } from '../application/managed-members.use-cases'
import { acceptSchema, changeRoleSchema, createManagedSchema, resetPasswordSchema, idParamSchema, inviteSchema, tokenParamSchema } from './members.schemas'

export class MembersController {
  constructor(
    private readonly listMembers: ListMembersUseCase,
    private readonly invite: InviteMemberUseCase,
    private readonly changeRole: ChangeMemberRoleUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly revokeInvitation: RevokeInvitationUseCase,
    private readonly previewInvitation: PreviewInvitationUseCase,
    private readonly acceptInvitation: AcceptInvitationUseCase,
    private readonly createManaged: CreateManagedMemberUseCase,
    private readonly resetPassword: ResetMemberPasswordUseCase,
  ) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.listMembers.execute({ tenant: req.tenant! }))
  }

  create = async (req: Request, res: Response) => {
    const body = inviteSchema.parse(req.body)
    res.status(201).json(await this.invite.execute({ tenant: req.tenant!, ...body }))
  }

  createWithPassword = async (req: Request, res: Response) => {
    res.status(201).json(await this.createManaged.execute({ tenant: req.tenant!, ...createManagedSchema.parse(req.body) }))
  }

  resetMemberPassword = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params)
    await this.resetPassword.execute({ tenant: req.tenant!, membershipId: id, ...resetPasswordSchema.parse(req.body) })
    res.status(204).end()
  }

  updateRole = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params)
    const { role } = changeRoleSchema.parse(req.body)
    await this.changeRole.execute({ tenant: req.tenant!, membershipId: id, role })
    res.status(204).end()
  }

  remove = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params)
    await this.removeMember.execute({ tenant: req.tenant!, membershipId: id })
    res.status(204).end()
  }

  revoke = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params)
    await this.revokeInvitation.execute({ tenant: req.tenant!, invitationId: id })
    res.status(204).end()
  }

  preview = async (req: Request, res: Response) => {
    const { token } = tokenParamSchema.parse(req.params)
    res.json(await this.previewInvitation.execute({ token }))
  }

  accept = async (req: Request, res: Response) => {
    const { token } = tokenParamSchema.parse(req.params)
    const body = acceptSchema.parse(req.body)
    const result = await this.acceptInvitation.execute({
      token,
      authUserId: req.auth?.userId,
      ...body,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    })
    if (result.tokens) setRefreshCookie(res, result.tokens)
    res.json({ accountId: result.accountId, accessToken: result.tokens?.accessToken })
  }
}
