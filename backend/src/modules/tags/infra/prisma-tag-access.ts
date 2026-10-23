import { AppError } from '../../../shared/errors/app-error'
import { prisma } from '../../../shared/infra/prisma'

/** Confere se as tags existem e podem ser usadas (do sistema ou da conta; só do sistema em modelos prontos). */
export class PrismaTagAccess {
  async assertUsable(accountId: string, tagIds: string[], options: { systemOnly: boolean }): Promise<void> {
    const unique = [...new Set(tagIds)]
    if (unique.length === 0) return
    const count = await prisma.tag.count({
      where: { id: { in: unique }, OR: options.systemOnly ? [{ accountId: null }] : [{ accountId }, { accountId: null }] },
    })
    if (count !== unique.length) {
      throw new AppError('INVALID_TAGS', options.systemOnly ? 'Modelos prontos só aceitam tags do sistema.' : 'Alguma das tags não existe ou não pertence a esta conta.', 422)
    }
  }
}
