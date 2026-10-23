import { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../../../shared/http/async-handler'
import type { SharingController } from './sharing.controller'

export const sharingRoutes = (c: SharingController, authenticate: RequestHandler, optionalAuthenticate: RequestHandler, tenant: RequestHandler, requireSupport: RequestHandler) => {
  const router = Router()
  // dono do modelo
  router.get('/templates/:id/sharing', authenticate, tenant, asyncHandler(c.show))
  router.put('/templates/:id/sharing', authenticate, tenant, asyncHandler(c.update))
  router.post('/templates/:id/library-submissions', authenticate, tenant, asyncHandler(c.submitToLibrary))
  router.delete('/templates/:id/library-submissions/pending', authenticate, tenant, asyncHandler(c.cancelSubmission))
  // link compartilhado: leitura aceita visitante (a regra PUBLIC/MEMBERS é decidida no caso de uso)
  router.get('/shared/:token', optionalAuthenticate, asyncHandler(c.showShared))
  router.post('/shared/:token/copy', authenticate, tenant, asyncHandler(c.copy))
  // revisão do suporte
  router.get('/support/library-submissions', authenticate, tenant, requireSupport, asyncHandler(c.listForReview))
  router.get('/support/library-submissions/:id', authenticate, tenant, requireSupport, asyncHandler(c.showSubmission))
  router.post('/support/library-submissions/:id/approve', authenticate, tenant, requireSupport, asyncHandler(c.approveSubmission))
  router.post('/support/library-submissions/:id/reject', authenticate, tenant, requireSupport, asyncHandler(c.rejectSubmission))
  return router
}
