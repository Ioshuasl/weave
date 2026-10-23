import type { CookieOptions, Response } from 'express'
import { env } from '../../../shared/config/env'
import type { SessionTokens } from '../domain/ports'

export const REFRESH_COOKIE = 'weave_refresh'

const options = (expires?: Date): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/auth',
  expires,
})

export const setRefreshCookie = (res: Response, tokens: SessionTokens) =>
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, options(tokens.refreshExpiresAt))

export const clearRefreshCookie = (res: Response) => res.clearCookie(REFRESH_COOKIE, options())
