import type { PageVariablesResolver } from '@/packages/weave'

/**
 * Variáveis por folha usadas pelos modelos de livro ({page.livro}, {page.folha}, {page.lado}):
 * livro 1 e uma folha a cada duas páginas (frente/verso). No sistema real, o host calcula a partir do último protocolo.
 */
export const defaultPageVariables: PageVariablesResolver = (sys) => {
  const face = sys.pageNumber - 1
  return { livro: '1', folha: String(Math.floor(face / 2) + 1), lado: face % 2 === 0 ? 'F' : 'V' }
}
