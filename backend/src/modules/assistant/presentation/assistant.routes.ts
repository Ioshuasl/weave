import { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../../../shared/http/async-handler'
import type { AssistantController } from './assistant.controller'

export const assistantRoutes = (c: AssistantController, authenticate: RequestHandler, tenant: RequestHandler) => {
  const router = Router()
  router.get('/assistant/status', authenticate, c.getStatus)
  // pedidos com imagem chegam a ~5 MB de base64
  router.post('/templates/:id/assistant', authenticate, tenant, asyncHandler(c.sendRequest))
  router.get('/templates/:id/assistant/history', authenticate, tenant, asyncHandler(c.listHistory))
  return router
}
