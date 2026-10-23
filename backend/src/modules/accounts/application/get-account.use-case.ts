import { notFound } from '../../../shared/errors/app-error'
import { assertCan } from '../../../shared/security/permissions'
import type { TenantContext } from '../../../shared/http/request-context'
import type { AccountRepository, AccountView } from '../domain/ports'

export class GetAccountUseCase {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(data: { tenant: TenantContext }): Promise<AccountView> {
    const account = await this.accounts.findById(data.tenant.accountId)
    if (!account) throw notFound('Conta não encontrada')
    return account
  }
}

export class UpdateAccountUseCase {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(data: { tenant: TenantContext; name?: string; document?: string | null }): Promise<AccountView> {
    assertCan(data.tenant.role, 'account:update')
    return this.accounts.update(data.tenant.accountId, { name: data.name, document: data.document })
  }
}
