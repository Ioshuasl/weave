const KEY = 'weave.next'

/** Guarda para onde voltar depois de entrar/criar conta (ex.: a página de um modelo compartilhado). */
export const rememberNext = (path: string) => {
  try {
    if (path.startsWith('/') && !path.startsWith('//')) window.sessionStorage.setItem(KEY, path)
  } catch {
    /* sem armazenamento: o usuário cai na página inicial */
  }
}

/** Lê e apaga o destino guardado (null se não houver). */
export const consumeNext = (): string | null => {
  try {
    const value = window.sessionStorage.getItem(KEY)
    window.sessionStorage.removeItem(KEY)
    return value && value.startsWith('/') && !value.startsWith('//') ? value : null
  } catch {
    return null
  }
}
