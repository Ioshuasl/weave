import { API_URL } from '@/shared/lib/api'

/** URL absoluta de um arquivo servido pela API (a API devolve caminhos relativos, ex.: /previews/x.webp). */
export const assetSrc = (path?: string | null) => (path ? `${API_URL}${path}` : null)
