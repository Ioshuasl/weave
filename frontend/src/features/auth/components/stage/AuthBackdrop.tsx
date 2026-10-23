'use client'

import { animate } from 'animejs'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { ChartSheet, KpiSheet, ListSheet, ReceiptSheet, TableSheet, TextSheet } from './SheetArt'

interface SheetSpec {
  id: string
  art: ReactNode
  /** posição na tela — as folhas ficam nas bordas e "espiam" por trás do painel */
  className: string
  rotate: number
  /** intensidade do parallax: folhas "mais próximas" se mexem mais */
  depth: number
  size: string
  /** só em telas largas */
  wideOnly?: boolean
}

const SHEETS: SheetSpec[] = [
  { id: 'tabela', art: <TableSheet />, className: 'left-[-3%] top-[8%]', rotate: -9, depth: 1, size: 'h-60 w-44' },
  { id: 'grafico', art: <ChartSheet />, className: 'left-[3%] bottom-[4%]', rotate: 6, depth: 0.6, size: 'h-52 w-40', wideOnly: true },
  { id: 'texto', art: <TextSheet />, className: 'right-[-2%] top-[5%]', rotate: 8, depth: 0.8, size: 'h-60 w-44' },
  { id: 'recibo', art: <ReceiptSheet />, className: 'right-[2%] bottom-[6%]', rotate: -7, depth: 1.2, size: 'h-56 w-40', wideOnly: true },
  { id: 'kpis', art: <KpiSheet />, className: 'left-[24%] top-[-6%]', rotate: 3, depth: 0.4, size: 'h-44 w-40' },
  { id: 'lista', art: <ListSheet />, className: 'right-[24%] bottom-[-7%]', rotate: -4, depth: 0.5, size: 'h-48 w-40' },
]

interface Ripple {
  id: number
  x: number
  y: number
}

const RippleRing = ({ ripple, onDone }: { ripple: Ripple; onDone: (id: number) => void }) => {
  const outer = useRef<HTMLSpanElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  const handleRun = () => {
    if (outer.current) animate(outer.current, { scale: [0.2, 1], opacity: [0.45, 0], duration: 1000, ease: 'outQuart', onComplete: () => onDone(ripple.id) })
    if (inner.current) animate(inner.current, { scale: [0.1, 0.7], opacity: [0.5, 0], duration: 800, delay: 120, ease: 'outQuart' })
  }
  useEffect(handleRun, [])

  return (
    <span className="pointer-events-none absolute" style={{ left: ripple.x, top: ripple.y }} aria-hidden>
      <span ref={outer} className="absolute -left-60 -top-60 rounded-full border-2 border-primary opacity-0" style={{ width: 480, height: 480 }} />
      <span ref={inner} className="absolute -left-40 -top-40 rounded-full border border-primary-border bg-primary-subtle opacity-0" style={{ width: 320, height: 320 }} />
    </span>
  )
}

interface SheetProps {
  spec: SheetSpec
  px: MotionValue<number>
  py: MotionValue<number>
  reduced: boolean
  register: (id: string, el: HTMLElement | null) => void
}

const Sheet = ({ spec, px, py, reduced, register }: SheetProps) => {
  const floatRef = useRef<HTMLDivElement>(null)
  const kickRef = useRef<HTMLDivElement>(null)

  // parallax: a folha se desloca no sentido contrário do mouse e inclina levemente
  const x = useTransform(px, (v) => v * -spec.depth * 46)
  const y = useTransform(py, (v) => v * -spec.depth * 34)
  const rotateY = useTransform(px, (v) => v * spec.depth * 10)
  const rotateX = useTransform(py, (v) => v * -spec.depth * 8)

  const handleFloat = () => {
    register(spec.id, kickRef.current)
    if (reduced || !floatRef.current) return () => register(spec.id, null)
    const seed = spec.depth * 1000
    const float = animate(floatRef.current, {
      translateY: [{ to: -10 - spec.depth * 6, duration: 2600 + seed }, { to: 8, duration: 2600 + seed }],
      rotate: [{ to: spec.rotate * 0.6, duration: 3200 + seed }, { to: spec.rotate * 1.2, duration: 3200 + seed }],
      ease: 'inOutSine',
      loop: true,
    })
    return () => {
      float.revert()
      register(spec.id, null)
    }
  }
  useEffect(handleFloat, [reduced])

  return (
    <motion.div style={{ x, y, rotateX, rotateY, rotate: spec.rotate, transformPerspective: 900 }} className={cn('pointer-events-auto absolute', spec.className, spec.wideOnly && 'hidden lg:block')}>
      <div ref={floatRef}>
        <div ref={kickRef}>
          <motion.div
            whileHover={reduced ? undefined : { scale: 1.06, y: -6, rotate: -spec.rotate * 0.3 }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className={cn('cursor-pointer rounded-lg border border-border bg-surface p-3 opacity-90 shadow-md transition-shadow hover:opacity-100 hover:shadow-lg', spec.size)}
          >
            {spec.art}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Fundo do fluxo de autenticação: folhas de relatório flutuantes.
 * - mover o mouse: parallax em camadas (profundidades diferentes);
 * - passar o mouse numa folha: ela sobe e cresce;
 * - clicar/tocar em qualquer lugar fora do painel: onda + as folhas próximas são empurradas e voltam com mola.
 */
export const AuthBackdrop = () => {
  const reduced = Boolean(useReducedMotion())
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 70, damping: 18, mass: 0.6 })
  const py = useSpring(my, { stiffness: 70, damping: 18, mass: 0.6 })
  const kickers = useRef(new Map<string, HTMLElement>())
  const [ripples, setRipples] = useState<Ripple[]>([])
  const nextId = useRef(0)

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) kickers.current.set(id, el)
    else kickers.current.delete(id)
  }, [])

  const handleKick = (clientX: number, clientY: number) => {
    kickers.current.forEach((el) => {
      const r = el.getBoundingClientRect()
      const dx = r.left + r.width / 2 - clientX
      const dy = r.top + r.height / 2 - clientY
      const dist = Math.hypot(dx, dy) || 1
      const force = Math.max(0, 1 - dist / 560)
      if (force === 0) return
      const push = 70 * force
      animate(el, {
        translateX: [{ to: (dx / dist) * push, duration: 170, ease: 'outQuad' }, { to: 0, duration: 1200, ease: 'outElastic(1, .45)' }],
        translateY: [{ to: (dy / dist) * push, duration: 170, ease: 'outQuad' }, { to: 0, duration: 1200, ease: 'outElastic(1, .45)' }],
        rotate: [{ to: (dx > 0 ? 1 : -1) * 8 * force, duration: 170, ease: 'outQuad' }, { to: 0, duration: 1200, ease: 'outElastic(1, .45)' }],
      })
    })
  }

  const handleListen = () => {
    if (reduced) return undefined
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    const onDown = (e: PointerEvent) => {
      // cliques dentro do painel (formulários/botões) não disparam a animação
      if ((e.target as HTMLElement).closest('[data-auth-panel]')) return
      setRipples((list) => [...list.slice(-4), { id: nextId.current++, x: e.clientX, y: e.clientY }])
      handleKick(e.clientX, e.clientY)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
    }
  }
  useEffect(handleListen, [reduced])

  const handleRippleDone = useCallback((id: number) => setRipples((list) => list.filter((r) => r.id !== id)), [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {SHEETS.map((spec) => (
        <Sheet key={spec.id} spec={spec} px={px} py={py} reduced={reduced} register={register} />
      ))}
      {ripples.map((r) => (
        <RippleRing key={r.id} ripple={r} onDone={handleRippleDone} />
      ))}
    </div>
  )
}
