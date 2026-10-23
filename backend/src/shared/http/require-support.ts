import type { RequestHandler } from 'express'
import { forbidden, unauthorized } from '../errors/app-error'

/** Só a equipe de suporte da plataforma (User.platformRole = SUPPORT). */
export const makeRequireSupport =
  (isSupport: (userId: string) => Promise<boolean>): RequestHandler =>
  async (req, _res, next) => {
    try {
      if (!req.auth) throw unauthorized()
      if (!(await isSupport(req.auth.userId))) throw forbidden('Acesso restrito à equipe de suporte')
      next()
    } catch (err) {
      next(err)
    }
  }
