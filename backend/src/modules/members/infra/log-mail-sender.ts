import { logger } from '../../../shared/infra/logger'
import type { MailSender } from '../domain/ports'

/** Até existir SMTP: o link do convite vai para o log do servidor. */
export class LogMailSender implements MailSender {
  async sendInvitation(data: { to: string; accountName: string; inviteUrl: string }) {
    logger.info({ to: data.to, account: data.accountName, inviteUrl: data.inviteUrl }, 'Convite (e-mail simulado)')
  }
}
