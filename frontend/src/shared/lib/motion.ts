import type { Transition, Variants } from 'framer-motion'

/** Curvas/molas compartilhadas do app (mesma linguagem de movimento em toda a navegação). */
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }
export const easeOut: Transition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] }

/** Entrada de página: sobe 10px com fade. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: easeOut },
}

export const listContainer: Variants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
}

export const listItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: easeOut },
}

export const fadeScale: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: easeOut },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
}
