import express, { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../../../shared/http/async-handler'
import type { IdentityController } from './identity.controller'

export const identityRoutes = (c: IdentityController, authenticate: RequestHandler, authenticateAllowRestricted: RequestHandler) => {
  const router = Router()
  router.post('/auth/login', asyncHandler(c.signIn))
  router.post('/auth/refresh', asyncHandler(c.refreshSession))
  router.post('/auth/logout', asyncHandler(c.signOut))
  router.get('/me', authenticateAllowRestricted, asyncHandler(c.me))
  router.patch('/me', authenticate, asyncHandler(c.patchMe))
  // foto enviada como corpo binário (JPEG/PNG/WebP, até 2 MB; o formato é conferido pelo cabeçalho do arquivo)
  router.put('/me/avatar', authenticate, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '2mb' }), asyncHandler(c.putAvatar))
  router.delete('/me/avatar', authenticate, asyncHandler(c.deleteAvatar))
  router.post('/me/password', authenticateAllowRestricted, asyncHandler(c.postPassword))
  router.get('/auth/sessions', authenticate, asyncHandler(c.getSessions))
  router.delete('/auth/sessions/:id', authenticate, asyncHandler(c.deleteSession))
  return router
}
