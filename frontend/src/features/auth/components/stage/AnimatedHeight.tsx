'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Anima a altura do contêiner quando o conteúdo muda (troca Entrar ⇄ Criar conta sem "pulo"). */
export const AnimatedHeight = ({ children }: { children: ReactNode }) => {
  const inner = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

  const handleObserve = () => {
    if (!inner.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.contentRect.height)
    })
    observer.observe(inner.current)
    return () => observer.disconnect()
  }
  useEffect(handleObserve, [])

  return (
    <motion.div animate={{ height }} initial={false} transition={{ type: 'spring', stiffness: 220, damping: 30 }} className="overflow-hidden">
      <div ref={inner}>{children}</div>
    </motion.div>
  )
}
