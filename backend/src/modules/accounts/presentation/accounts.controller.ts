import type { Request, Response } from 'express'
import type { RegisterAccountUseCase } from '../application/register-account.use-case'
import type { GetAccountUseCase, UpdateAccountUseCase } from '../application/get-account.use-case'
import { setRefreshCookie } from '../../identity'
import { registerSchema, updateAccountSchema } from './accounts.schemas'

export class AccountsController {
  constructor(
    private readonly register: RegisterAccountUseCase,
    private readonly getAccount: GetAccountUseCase,
    private readonly updateAccount: UpdateAccountUseCase,
  ) {}

  signUp = async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body)
    const { accountId, ...tokens } = await this.register.execute({
      ...body,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    })
    setRefreshCookie(res, tokens)
    res.status(201).json({ accessToken: tokens.accessToken, accountId })
  }

  show = async (req: Request, res: Response) => {
    res.json(await this.getAccount.execute({ tenant: req.tenant! }))
  }

  update = async (req: Request, res: Response) => {
    const body = updateAccountSchema.parse(req.body)
    res.json(await this.updateAccount.execute({ tenant: req.tenant!, ...body }))
  }
}
