export interface AssistantImage {
  nome: string
  tipo: 'image/jpeg' | 'image/png' | 'image/webp'
  base64: string
}

/** Contrato do webhook n8n (AUTWEAVE-1): entrada. */
export interface AssistantGatewayRequest {
  sessao_id: string
  usuario_id: string
  tenant: string
  pedido: string
  modo: 'normal' | 'passo'
  selecao: { componentes: string[]; bandas: string[] }
  relatorio: { bandas: Record<string, unknown>[] }
  campos: Record<string, unknown>[]
  colunas_layout: Record<string, unknown>[]
  imagens: AssistantImage[]
}

export interface AssistantUsage {
  modelo?: string
  prompt_tokens?: number
  cached_tokens?: number
  completion_tokens?: number
  reasoning_tokens?: number
  latencia_ms?: number
  grupos?: string
  motivo_retry?: string
}

/** Saída do workflow já validada (ações do catálogo fechado). */
export interface AssistantReply {
  mensagem: string
  acoes: Record<string, unknown>[]
  passos: string[]
  pergunta: boolean
  opcoes: string[]
  confirmacao: { resumo: string[]; acoes: Record<string, unknown>[] } | null
  uso: AssistantUsage | null
}

export interface AssistantGateway {
  isConfigured(): boolean
  send(request: AssistantGatewayRequest): Promise<AssistantReply>
}

export type InteractionKind = 'ACTIONS' | 'QUESTION' | 'PLAN' | 'CONFIRMATION'

export interface InteractionRecord {
  templateId: string
  accountId: string
  userId: string
  sessionKey: string
  request: string
  message: string
  actions: Record<string, unknown>[]
  kind: InteractionKind
  usage: AssistantUsage | null
}

export interface InteractionView {
  id: string
  request: string
  message: string
  kind: InteractionKind
  actionCount: number
  userName: string
  userAvatarUrl: string | null
  createdAt: Date
}

export interface AssistantHistoryRepository {
  record(data: InteractionRecord): Promise<void>
  list(templateId: string, limit: number): Promise<InteractionView[]>
}

/** Porta para o módulo `templates`: só precisamos saber se o modelo existe e se é editável. */
export interface TemplateLookup {
  findVisible(accountId: string, templateId: string): Promise<{ isSystem: boolean } | null>
}
