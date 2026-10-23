export type AssistantInteractionKindEnum = 'ACTIONS' | 'QUESTION' | 'PLAN' | 'CONFIRMATION'

export const AssistantInteractionKindLabel: Record<AssistantInteractionKindEnum, string> = {
  ACTIONS: 'Alteração proposta',
  QUESTION: 'Pergunta do assistente',
  PLAN: 'Plano em etapas',
  CONFIRMATION: 'Aguardando confirmação',
}
