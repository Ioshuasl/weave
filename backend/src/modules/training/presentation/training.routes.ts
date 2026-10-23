import { Router, type RequestHandler } from 'express'
import { asyncHandler } from '../../../shared/http/async-handler'
import type { TrainingController } from './training.controller'

export const trainingRoutes = (c: TrainingController, authenticate: RequestHandler, requireSupport: RequestHandler) => {
  const router = Router()
  router.get('/training', authenticate, asyncHandler(c.index))
  router.get('/training/lessons/:id', authenticate, asyncHandler(c.lesson))
  router.put('/training/lessons/:id/completed', authenticate, asyncHandler(c.complete(true)))
  router.delete('/training/lessons/:id/completed', authenticate, asyncHandler(c.complete(false)))

  const admin = [authenticate, requireSupport]
  router.get('/support/training', ...admin, asyncHandler(c.adminIndex))
  router.post('/support/training/tracks', ...admin, asyncHandler(c.adminCreateTrack))
  router.patch('/support/training/tracks/:id', ...admin, asyncHandler(c.adminUpdateTrack))
  router.delete('/support/training/tracks/:id', ...admin, asyncHandler(c.adminDeleteTrack))
  router.post('/support/training/tracks/:id/lessons', ...admin, asyncHandler(c.adminCreateLesson))
  router.patch('/support/training/lessons/:id', ...admin, asyncHandler(c.adminUpdateLesson))
  router.delete('/support/training/lessons/:id', ...admin, asyncHandler(c.adminDeleteLesson))
  return router
}
