'use client'

import { animate, stagger } from 'animejs'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

/** Ao ativar o formulário, os campos entram em cascata (anime.js). Sem efeito com "reduzir movimento". */
export const useStaggerIn = (active: boolean, delayMs = 0) => {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = Boolean(useReducedMotion())

  const handleStagger = () => {
    if (!active || reduced || !ref.current) return undefined
    const targets = ref.current.querySelectorAll('header, form > *, p')
    const animation = animate(targets, {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: stagger(55, { start: delayMs }),
      duration: 520,
      ease: 'outCubic',
    })
    return () => {
      animation.revert()
    }
  }
  useEffect(handleStagger, [active])

  return ref
}
