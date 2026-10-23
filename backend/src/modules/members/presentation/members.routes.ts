import { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../../../shared/http/async-handler'
import type { MembersController } from './members.controller'

export const membersRoutes = (
  c: MembersController,
  authenticate: RequestHandler,
  optionalAuthenticate: RequestHandler,
  tenant: RequestHandler,
) => {
  const router = Router()
  router.get('/invitations/:token', asyncHandler(c.preview))
  router.post('/invitations/:token/accept', optionalAuthenticate, asyncHandler(c.accept))

  router.get('/members', authenticate, tenant, asyncHandler(c.list))
  router.post('/members', authenticate, tenant, asyncHandler(c.createWithPassword))
  router.post('/members/:id/reset-password', authenticate, tenant, asyncHandler(c.resetMemberPassword))
  router.post('/members/invitations', authenticate, tenant, asyncHandler(c.create))
  router.delete('/members/invitations/:id', authenticate, tenant, asyncHandler(c.revoke))
  router.patch('/members/:id/role', authenticate, tenant, asyncHandler(c.updateRole))
  router.delete('/members/:id', authenticate, tenant, asyncHandler(c.remove))
  return router
}
