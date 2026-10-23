import { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../../../shared/http/async-handler'
import type { TagsController } from './tags.controller'

export const tagsRoutes = (c: TagsController, authenticate: RequestHandler, tenant: RequestHandler) => {
  const router = Router()
  router.use('/tags', authenticate, tenant)
  router.get('/tags', asyncHandler(c.list))
  router.post('/tags', asyncHandler(c.create))
  router.patch('/tags/:id', asyncHandler(c.update))
  router.delete('/tags/:id', asyncHandler(c.remove))
  return router
}
