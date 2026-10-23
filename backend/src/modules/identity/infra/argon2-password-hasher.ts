import argon2 from 'argon2'
import type { PasswordHasher } from '../domain/ports'

export class Argon2PasswordHasher implements PasswordHasher {
  hash(plain: string) {
    return argon2.hash(plain)
  }

  verify(hash: string, plain: string) {
    return argon2.verify(hash, plain)
  }
}
