import jwt from 'jsonwebtoken'
import type { AccessTokenService } from '../domain/ports'

export class JwtAccessTokenService implements AccessTokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlMinutes: number,
  ) {}

  sign(userId: string, restricted = false) {
    return jwt.sign(restricted ? { restricted: true } : {}, this.secret, { subject: userId, expiresIn: `${this.ttlMinutes}m` })
  }

  verify(token: string) {
    try {
      const payload = jwt.verify(token, this.secret)
      return typeof payload === 'object' && payload.sub ? { userId: payload.sub, restricted: payload.restricted === true } : null
    } catch {
      return null
    }
  }
}
