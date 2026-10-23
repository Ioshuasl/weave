/** Consumo de tokens de UM pedido (vem do backend do host em `AssistantResponse.uso`) */
export interface AssistantUsage {
  modelo: string;
  prompt_tokens: number;
  cached_tokens: number;
  /** Já inclui os tokens de raciocínio (como a OpenAI informa) */
  completion_tokens: number;
  reasoning_tokens: number;
  latencia_ms: number;
  /** Blocos do catálogo enviados ao modelo (`completo` = tudo) */
  grupos?: string;
  motivo_retry?: string;
}

/** Fatias disjuntas que somam o total: o que cada token foi */
export interface AssistantUsageSlices {
  /** Entrada que o modelo leu "do zero" */
  fresh: number;
  /** Entrada reaproveitada do cache (custa ~10x menos) */
  cached: number;
  /** Raciocínio interno do modelo (cobrado como saída) */
  reasoning: number;
  /** Texto/ações devolvidos */
  answer: number;
  total: number;
}

/** Resposta guardada reaproveitada ("Sim" local): nenhuma chamada à IA */
export const isLocalUsage = (usage: AssistantUsage) => usage.modelo === 'pendente-local';

export const sliceAssistantUsage = (usage: AssistantUsage): AssistantUsageSlices => {
  const cached = Math.min(Math.max(usage.cached_tokens, 0), Math.max(usage.prompt_tokens, 0));
  const reasoning = Math.min(Math.max(usage.reasoning_tokens, 0), Math.max(usage.completion_tokens, 0));
  const fresh = Math.max(usage.prompt_tokens, 0) - cached;
  const answer = Math.max(usage.completion_tokens, 0) - reasoning;
  return { fresh, cached, reasoning, answer, total: fresh + cached + reasoning + answer };
};

export const sumAssistantUsage = (list: AssistantUsage[]): AssistantUsageSlices =>
  list.map(sliceAssistantUsage).reduce(
    (acc, s) => ({ fresh: acc.fresh + s.fresh, cached: acc.cached + s.cached, reasoning: acc.reasoning + s.reasoning, answer: acc.answer + s.answer, total: acc.total + s.total }),
    { fresh: 0, cached: 0, reasoning: 0, answer: 0, total: 0 }
  );

/** 980 -> "980"; 3481 -> "3,5 mil"; 12000 -> "12 mil" */
export const formatTokenCount = (value: number) => {
  if (value < 1000) return String(Math.round(value));
  const thousands = value / 1000;
  return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1).replace('.', ',').replace(/,0$/, '')} mil`;
};

/** 2402 -> "2,4 s"; 281 -> "0,3 s" */
export const formatLatency = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
