import type { RequestHandler } from 'express'
import { forbidden, unauthorized } from '../../../shared/errors/app-error'
import type { AccountRepository } from '../domain/ports'

export const makeTenantContext =
  (accounts: AccountRepository): RequestHandler =>
  async (req, _res, next) => {
    try {
      if (!req.auth) throw unauthorized()
      const accountId = req.get('x-account-id')
      if (!accountId) throw forbidden('Conta não informada (header X-Account-Id)')
      const role = await accounts.findActiveRole(accountId, req.auth.userId)
      if (!role) throw forbidden('Você não pertence a esta conta')
      req.tenant = { userId: req.auth.userId, accountId, role, isSupport: await accounts.isSupport(req.auth.userId) }
      next()
    } catch (err) {
      next(err)
    }
  }
