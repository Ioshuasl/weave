import { API_URL } from '@/shared/lib/api'

/** URL absoluta da foto de perfil (a API devolve um caminho relativo). */
export const avatarSrc = (avatarUrl?: string | null) => (avatarUrl ? `${API_URL}${avatarUrl}` : null)
