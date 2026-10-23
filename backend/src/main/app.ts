import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { accountsRoutes } from '../modules/accounts/presentation/accounts.routes'
import { identityRoutes } from '../modules/identity'
import { membersRoutes } from '../modules/members'
import { assistantRoutes } from '../modules/assistant'
import { trainingRoutes } from '../modules/training'
import { tagsRoutes } from '../modules/tags'
import { sharingRoutes, templatesRoutes } from '../modules/templates'
import { env } from '../shared/config/env'
import { errorMiddleware } from '../shared/http/error-middleware'
import { buildContainer } from './composition-root'

export const createApp = () => {
  const c = buildContainer()
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
  app.use(/^\/templates\/[^/]+\/assistant$/, express.json({ limit: '8mb' }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  // fotos de perfil: nomes aleatórios (não adivinháveis); CORP liberado para o <img> do frontend em outra origem
  app.use(
    '/avatars',
    (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      next()
    },
    express.static(c.avatarDir, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }),
  )

  // miniaturas dos modelos: nomes aleatórios; CORP liberado para o <img> do frontend em outra origem
  app.use(
    '/previews',
    (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      next()
    },
    express.static(c.previewDir, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }),
  )

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.use(identityRoutes(c.identity, c.authenticate, c.authenticateAllowRestricted))
  app.use(accountsRoutes(c.accounts, c.authenticate, c.tenant))
  app.use(membersRoutes(c.members, c.authenticate, c.optionalAuthenticate, c.tenant))
  app.use(tagsRoutes(c.tags, c.authenticate, c.tenant))
  app.use(trainingRoutes(c.training, c.authenticate, c.requireSupport))
  app.use(assistantRoutes(c.assistant, c.authenticate, c.tenant))
  app.use(sharingRoutes(c.sharing, c.authenticate, c.optionalAuthenticate, c.tenant, c.requireSupport))
  app.use(templatesRoutes(c.templates, c.mockDatasets, c.authenticate, c.tenant, c.requireSupport))

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } })
  })
  app.use(errorMiddleware)
  return app
}
