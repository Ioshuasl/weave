import { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../../../shared/http/async-handler'
import type { AccountsController } from './accounts.controller'

export const accountsRoutes = (c: AccountsController, authenticate: RequestHandler, tenant: RequestHandler) => {
  const router = Router()
  router.post('/auth/register', asyncHandler(c.signUp))
  router.get('/account', authenticate, tenant, asyncHandler(c.show))
  router.patch('/account', authenticate, tenant, asyncHandler(c.update))
  return router
}
