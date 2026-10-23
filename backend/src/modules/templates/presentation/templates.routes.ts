import express, { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../../../shared/http/async-handler'
import type { MockDatasetsController } from './mock-datasets.controller'
import type { TemplatesController } from './templates.controller'

export const templatesRoutes = (c: TemplatesController, m: MockDatasetsController, authenticate: RequestHandler, tenant: RequestHandler, requireSupport: RequestHandler) => {
  const router = Router()
  router.use('/templates', authenticate, tenant)
  router.get('/templates', asyncHandler(c.list))
  router.post('/templates', asyncHandler(c.create))
  router.get('/templates/:id', asyncHandler(c.show))
  router.patch('/templates/:id', asyncHandler(c.update))
  router.delete('/templates/:id', asyncHandler(c.archive))
  // miniatura: corpo binário (JPEG/PNG/WebP, até 1 MB; o formato é conferido pelo cabeçalho do arquivo)
  router.put('/templates/:id/preview', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '1mb' }), asyncHandler(c.putPreview))
  router.post('/templates/:id/duplicate', asyncHandler(c.duplicate))
  router.get('/templates/:id/versions', asyncHandler(c.versions))
  router.get('/templates/:id/versions/:number/diff', asyncHandler(c.diff))
  router.post('/templates/:id/versions/:number/restore', asyncHandler(c.restore))
  router.get('/templates/:id/mock-datasets', asyncHandler(m.list))
  router.post('/templates/:id/mock-datasets', asyncHandler(m.create))
  router.patch('/templates/:id/mock-datasets/:datasetId', asyncHandler(m.update))
  router.delete('/templates/:id/mock-datasets/:datasetId', asyncHandler(m.remove))
  // painel do suporte: modelos prontos (do sistema)
  router.post('/support/templates', authenticate, tenant, requireSupport, asyncHandler(c.createSystemTemplate))
  router.post('/support/templates/:id/publish', authenticate, tenant, requireSupport, asyncHandler(c.publishAsSystem))
  return router
}
