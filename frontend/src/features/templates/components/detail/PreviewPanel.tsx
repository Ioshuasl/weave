'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, Copy, Eye, PenTool } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { assetSrc } from '@/shared/actions/assetSrc'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { RelativeTime } from '@/shared/ui/RelativeTime'
import { usePreviewGeneratorHook } from '../../hooks/usePreviewGeneratorHook'
import type { TemplateDetail } from '../../types'

interface Props {
  template: TemplateDetail
  canEdit: boolean
  canUse: boolean
  onUse: () => void
  onPreviewReady: (url: string) => void
}

/** Prévia grande da folha sobre o palco (inclina de leve seguindo o mouse) + ações principais. */
export const PreviewPanel = ({ template, canEdit, canUse, onUse, onPreviewReady }: Props) => {
  const generator = usePreviewGeneratorHook((_, url) => onPreviewReady(url))
  const src = assetSrc(template.previewUrl)
  const [loaded, setLoaded] = useState(false)
  const stage = useRef<HTMLDivElement>(null)

  // efeito de profundidade: a folha acompanha o mouse com uma inclinação suave
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 140, damping: 18 })
  const sy = useSpring(my, { stiffness: 140, damping: 18 })
  const rotateY = useTransform(sx, [-0.5, 0.5], [-9, 9])
  const rotateX = useTransform(sy, [-0.5, 0.5], [7, -7])

  const handleMove = (e: React.PointerEvent) => {
    const r = stage.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const handleLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const handleRequestMissing = () => {
    if (!template.previewUrl) generator.handleRequest(template.id)
  }
  useEffect(handleRequestMissing, [template.id, template.previewUrl])

  return (
    <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
      <div
        ref={stage}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={cn('relative flex h-[26rem] items-center justify-center overflow-hidden rounded-xl border border-border px-8 py-8', template.isSystem ? 'bg-stage-brand' : 'bg-stage')}
        style={{ backgroundImage: 'radial-gradient(rgb(15 23 42 / 9%) 1px, transparent 1px)', backgroundSize: '14px 14px', perspective: 900 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          style={{ rotateX, rotateY, aspectRatio: '794 / 1123', transformStyle: 'preserve-3d' }}
          className="relative h-full max-h-[22rem] overflow-hidden rounded-[3px] border border-border-strong/70 bg-surface shadow-lg"
        >
          {src ? (
            <>
              {!loaded && <div className="absolute inset-0 animate-pulse bg-surface-secondary" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Prévia de ${template.name}`} draggable={false} onLoad={() => setLoaded(true)} className={cn('absolute inset-0 size-full origin-[50%_4%] scale-[1.12] object-cover object-top transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')} />
            </>
          ) : (
            <div className="flex h-full animate-pulse flex-col gap-2 p-[12%]">
              <div className="h-2 w-2/3 rounded-full bg-surface-tertiary" />
              {[100, 92, 96, 70, 88, 60, 90, 75].map((w, i) => <div key={i} className="h-1.5 rounded-full bg-surface-secondary" style={{ width: `${w}%` }} />)}
            </div>
          )}
        </motion.div>
      </div>

      <div className="flex flex-col gap-2">
        {canEdit && (
          <Link href={`/editor/${template.id}`} className="group inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover">
            <PenTool className="size-4" aria-hidden />Abrir editor
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
        {template.isSystem && !canEdit && (
          <Button size="lg" disabled={!canUse} onClick={onUse}><Copy className="size-4" aria-hidden />Usar este modelo</Button>
        )}
        <Link href={`/editor/${template.id}?mode=preview`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-secondary">
          <Eye className="size-4" aria-hidden />Pré-visualizar com dados de exemplo
        </Link>
      </div>

      <p className="text-center text-xs text-fg-muted">
        Versão {template.currentVersion} · <RelativeTime value={template.updatedAt} prefix="atualizado" />
      </p>
    </aside>
  )
}
