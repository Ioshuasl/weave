export const ASSISTANT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const ASSISTANT_IMAGE_LIMITS = {
  /** Imagens por pedido */
  maxCount: 3,
  /** Tamanho do arquivo escolhido pelo usuário (antes da redução) */
  maxBytes: 8 * 1024 * 1024,
  /** Lado maior da imagem enviada, em px (leitura de texto pequeno exige resolução, mas custo cresce com ela) */
  maxEdge: 1280,
  jpegQuality: 0.82,
} as const;

/** Pedido padrão quando o usuário anexa a imagem e não escreve nada */
export const ASSISTANT_IMAGE_DEFAULT_REQUEST = 'Use a imagem anexada como referência para ajustar o relatório.';

export const ASSISTANT_IMAGE_PRIVACY_HINT = 'Não envie imagens com dados reais de clientes (CPF, nomes). Use um modelo em branco ou oculte os dados.';

/** Imagem já reduzida e pronta para ir ao backend (base64 puro, sem o prefixo `data:`) */
export interface AssistantImage {
  nome: string;
  tipo: (typeof ASSISTANT_IMAGE_TYPES)[number];
  base64: string;
}

/** Mensagem de erro (pt-BR) se o arquivo não pode ser anexado; `null` se pode. */
export function validateAssistantImageFile(file: { type: string; size: number }, currentCount: number): string | null {
  if (currentCount >= ASSISTANT_IMAGE_LIMITS.maxCount) return `Você pode anexar até ${ASSISTANT_IMAGE_LIMITS.maxCount} imagens por pedido.`;
  if (!(ASSISTANT_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Use uma imagem PNG, JPG ou WEBP.';
  if (file.size > ASSISTANT_IMAGE_LIMITS.maxBytes) return `A imagem é grande demais (máximo ${ASSISTANT_IMAGE_LIMITS.maxBytes / 1024 / 1024} MB).`;
  return null;
}

/** Reduz mantendo a proporção até o lado maior caber em `maxEdge`; nunca amplia. */
export function computeResizedSize(width: number, height: number, maxEdge: number = ASSISTANT_IMAGE_LIMITS.maxEdge): { width: number; height: number } {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** Nome seguro para enviar: sem caminho, só letras/números/ponto/hífen/sublinhado, até 60 caracteres. */
export function sanitizeImageName(name: string, fallback = 'imagem'): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const noExt = base.replace(/\.[^.]*$/, '');
  const clean = noExt.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').replace(/^[._-]+|[._-]+$/g, '').slice(0, 60);
  return clean || fallback;
}
