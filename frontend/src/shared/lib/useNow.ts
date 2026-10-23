'use client'

import { useEffect, useState } from 'react'

/** Instante atual, atualizado a cada `intervalMs` (para textos como "há 2 min" não envelhecerem na tela). */
export const useNow = (intervalMs = 60_000) => {
  const [now, setNow] = useState(() => Date.now())

  const handleTick = () => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }
  useEffect(handleTick, [intervalMs])

  return now
}
