import type { RequestHandler } from 'express'
import { AppError, unauthorized } from '../../../shared/errors/app-error'
import type { AccessTokenService } from '../domain/ports'

const bearer = (header?: string) => (header?.startsWith('Bearer ') ? header.slice(7) : undefined)

/**
 * Exige login. Token "restrito" (senha provisória ainda não trocada) é recusado aqui:
 * só as rotas marcadas com `makeAuthenticateAllowRestricted` (perfil e troca de senha) aceitam.
 */
export const makeAuthenticate =
  (tokens: AccessTokenService, allowRestricted = false): RequestHandler =>
  (req, _res, next) => {
    const token = bearer(req.headers.authorization)
    const payload = token ? tokens.verify(token) : null
    if (!payload) return next(unauthorized())
    if (payload.restricted && !allowRestricted) {
      return next(new AppError('PASSWORD_CHANGE_REQUIRED', 'Defina sua senha definitiva para continuar.', 403))
    }
    req.auth = { userId: payload.userId }
    next()
  }

export const makeOptionalAuthenticate =
  (tokens: AccessTokenService): RequestHandler =>
  (req, _res, next) => {
    const token = bearer(req.headers.authorization)
    const payload = token ? tokens.verify(token) : null
    if (payload && !payload.restricted) req.auth = { userId: payload.userId }
    next()
  }
