import { createHash } from 'node:crypto'
import { AppError, forbidden, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import { assertCan } from '../../../shared/security/permissions'
import { assertValidImages } from '../domain/image-validation'
import type {
  AssistantGateway,
  AssistantGatewayRequest,
  AssistantHistoryRepository,
  AssistantReply,
  InteractionKind,
  TemplateLookup,
} from '../domain/ports'

export type AssistantInput = Omit<AssistantGatewayRequest, 'usuario_id' | 'tenant' | 'sessao_id'> & { sessao_id: string }

const kindOf = (r: AssistantReply): InteractionKind =>
  r.confirmacao ? 'CONFIRMATION' : r.passos.length ? 'PLAN' : r.pergunta ? 'QUESTION' : 'ACTIONS'

export class GetAssistantStatusUseCase {
  constructor(private readonly gateway: AssistantGateway) {}

  execute(): { enabled: boolean } {
    return { enabled: this.gateway.isConfigured() }
  }
}

export class SendAssistantRequestUseCase {
  constructor(
    private readonly gateway: AssistantGateway,
    private readonly history: AssistantHistoryRepository,
    private readonly templates: TemplateLookup,
  ) {}

  async execute(data: { tenant: TenantContext; templateId: string; input: AssistantInput }): Promise<AssistantReply> {
    assertCan(data.tenant.role, 'templates:write')
    if (!this.gateway.isConfigured()) throw new AppError('ASSISTANT_DISABLED', 'Assistente de IA não configurado.', 503)
    const template = await this.templates.findVisible(data.tenant.accountId, data.templateId)
    if (!template) throw notFound('Modelo não encontrado')
    if (template.isSystem && !data.tenant.isSupport) throw forbidden('O assistente só altera modelos da sua conta. Use "Usar modelo" para criar uma cópia.')
    assertValidImages(data.input.imagens)

    // sessão da conversa isolada por conta + usuário + modelo (o n8n guarda o histórico por essa chave)
    const sessionKey = createHash('sha256')
      .update(`${data.tenant.accountId}:${data.tenant.userId}:${data.templateId}:${data.input.sessao_id}`)
      .digest('base64url')
      .slice(0, 40)

    const reply = await this.gateway.send({
      ...data.input,
      sessao_id: sessionKey,
      usuario_id: data.tenant.userId,
      tenant: data.tenant.accountId,
    })

    await this.history.record({
      templateId: data.templateId,
      accountId: data.tenant.accountId,
      userId: data.tenant.userId,
      sessionKey,
      request: data.input.pedido,
      message: reply.mensagem,
      actions: reply.confirmacao?.acoes ?? reply.acoes,
      kind: kindOf(reply),
      usage: reply.uso,
    })
    return reply
  }
}

export class ListAssistantHistoryUseCase {
  constructor(
    private readonly history: AssistantHistoryRepository,
    private readonly templates: TemplateLookup,
  ) {}

  async execute(data: { tenant: TenantContext; templateId: string }) {
    assertCan(data.tenant.role, 'templates:read')
    if (!(await this.templates.findVisible(data.tenant.accountId, data.templateId))) throw notFound('Modelo não encontrado')
    return this.history.list(data.templateId, 50)
  }
}
