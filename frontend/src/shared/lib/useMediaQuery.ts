'use client'

import { useCallback, useSyncExternalStore } from 'react'

/** `null` até a hidratação (o servidor não conhece a largura da tela); depois true/false. */
export const useMediaQuery = (query: string): boolean | null => {
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', notify)
      return () => media.removeEventListener('change', notify)
    },
    [query],
  )
  return useSyncExternalStore<boolean | null>(
    subscribe,
    () => window.matchMedia(query).matches,
    () => null,
  )
}
