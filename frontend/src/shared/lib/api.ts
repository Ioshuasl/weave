export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message)
  }
}

let accessToken: string | null = null
let activeAccountId: string | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
}
export const setActiveAccountId = (id: string | null) => {
  activeAccountId = id
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** corpo binário (ex.: foto); envia o próprio Content-Type do arquivo */
  blob?: Blob
  tenant?: boolean
  retry?: boolean
}

const send = (path: string, o: RequestOptions) => {
  const headers: Record<string, string> = {}
  if (o.body !== undefined) headers['Content-Type'] = 'application/json'
  if (o.blob) headers['Content-Type'] = o.blob.type
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (o.tenant && activeAccountId) headers['X-Account-Id'] = activeAccountId
  return fetch(`${API_URL}${path}`, {
    method: o.method ?? 'GET',
    headers,
    body: o.blob ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined),
    credentials: 'include',
  })
}

export const refreshAccessToken = async (): Promise<boolean> => {
  const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
  if (!res.ok) {
    accessToken = null
    return false
  }
  accessToken = ((await res.json()) as { accessToken: string }).accessToken
  return true
}

const AUTH_PATHS_WITHOUT_RETRY = new Set(['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'])

export const api = async <T = void>(path: string, o: RequestOptions = {}): Promise<T> => {
  let res = await send(path, o)
  if (res.status === 401 && accessToken && !AUTH_PATHS_WITHOUT_RETRY.has(path) && o.retry !== false) {
    if (await refreshAccessToken()) res = await send(path, { ...o, retry: false })
  }
  if (res.status === 204) return undefined as T
  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    const e = (payload as { error?: { code?: string; message?: string; details?: Record<string, string[]> } } | null)?.error
    throw new ApiError(res.status, e?.code ?? 'ERROR', e?.message ?? 'Erro inesperado', e?.details)
  }
  return payload as T
}
