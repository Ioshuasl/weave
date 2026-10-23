import { AppError } from '../../../shared/errors/app-error'
import { logger } from '../../../shared/infra/logger'
import type { AssistantGateway, AssistantGatewayRequest, AssistantReply } from '../domain/ports'

export interface N8nGatewayConfig {
  url?: string
  user?: string
  password?: string
  timeoutSeconds: number
}

const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 600

interface N8nBody {
  sucesso?: boolean
  mensagem?: string
  codigo?: string
  acoes?: Record<string, unknown>[]
  passos?: string[]
  pergunta?: boolean
  opcoes?: string[]
  confirmacao?: { resumo?: string[]; acoes?: Record<string, unknown>[] } | null
  tentativas?: number
  uso?: AssistantReply['uso']
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Único ponto que fala com o n8n (integração externa). O domínio nunca faz HTTP direto.
 * Repete só falha de conexão (nunca timeout): o pedido não altera dados do Weave.
 */
export class N8nAssistantGateway implements AssistantGateway {
  constructor(private readonly config: N8nGatewayConfig) {}

  isConfigured() {
    return Boolean(this.config.url && this.config.user)
  }

  private async post(request: AssistantGatewayRequest): Promise<Response> {
    const auth = Buffer.from(`${this.config.user}:${this.config.password ?? ''}`).toString('base64')
    let lastError: unknown
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await fetch(this.config.url!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
            // o Cloudflare na frente do n8n bloqueia user-agents de bibliotecas (erro 1010)
            'User-Agent': 'curl/8.5.0',
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.config.timeoutSeconds * 1000),
        })
      } catch (err) {
        if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
          throw new AppError('ASSISTANT_TIMEOUT', 'O assistente demorou demais para responder. Tente novamente.', 504)
        }
        lastError = err
        if (attempt < MAX_ATTEMPTS) await sleep(BASE_DELAY_MS * 2 ** (attempt - 1))
      }
    }
    logger.warn({ err: lastError }, 'weave_assistente_conexao_falhou')
    throw new AppError('ASSISTANT_UNAVAILABLE', 'O assistente de IA está indisponível no momento.', 502)
  }

  async send(request: AssistantGatewayRequest): Promise<AssistantReply> {
    const response = await this.post(request)
    const body = ((await response.json().catch(() => null)) ?? {}) as N8nBody
    const message = (body.mensagem ?? '').trim()

    if (response.status === 429) {
      throw new AppError('ASSISTANT_RATE_LIMIT', message || 'Muitos pedidos em pouco tempo. Aguarde um minuto e tente de novo.', 429)
    }
    if (response.status === 422) {
      throw new AppError('ASSISTANT_UNSAFE', message || 'Não foi possível montar uma alteração segura para esse pedido.', 422)
    }
    if (response.status !== 200) {
      logger.warn({ status: response.status, codigo: body.codigo }, 'weave_assistente_falha')
      throw new AppError('ASSISTANT_UNAVAILABLE', message || `O assistente de IA está indisponível no momento (HTTP ${response.status}).`, 502)
    }
    if (!body.sucesso) {
      throw new AppError('ASSISTANT_FAILED', message || 'O assistente de IA não concluiu o pedido.', 422)
    }

    const uso = body.uso ?? null
    logger.info(
      {
        modelo: uso?.modelo,
        prompt: uso?.prompt_tokens,
        cache: uso?.cached_tokens,
        saida: uso?.completion_tokens,
        raciocinio: uso?.reasoning_tokens,
        latencia_ms: uso?.latencia_ms,
        tentativas: body.tentativas,
        retry: uso?.motivo_retry || '-',
        imagens: request.imagens.length,
      },
      'weave_assistente_uso',
    )

    return {
      mensagem: message,
      acoes: body.acoes ?? [],
      passos: body.passos ?? [],
      pergunta: body.pergunta ?? false,
      opcoes: body.opcoes ?? [],
      confirmacao: body.confirmacao ? { resumo: body.confirmacao.resumo ?? [], acoes: body.confirmacao.acoes ?? [] } : null,
      uso,
    }
  }
}
