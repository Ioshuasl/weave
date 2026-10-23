import { unauthorized } from '../../../shared/errors/app-error'
import type { UserProfile, UserRepository } from '../domain/ports'

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(data: { userId: string }): Promise<UserProfile> {
    const profile = await this.users.findProfile(data.userId)
    if (!profile) throw unauthorized()
    return profile
  }
}
