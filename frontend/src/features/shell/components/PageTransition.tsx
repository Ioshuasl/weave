'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { pageVariants } from '@/shared/lib/motion'

/**
 * Anima a entrada de cada página (fade + subida suave). A chave é o caminho: trocar de rota remonta o
 * bloco e dispara a animação. Sem animação de saída de propósito — no App Router o conteúdo antigo já
 * foi trocado quando o exit começaria, então ele só atrasaria a navegação.
 */
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  return (
    <motion.main key={pathname} variants={pageVariants} initial="initial" animate="animate" className="min-w-0">
      {children}
    </motion.main>
  )
}
