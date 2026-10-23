'use client'

import { useEffect, useRef, useState } from 'react'
import { assetSrc } from '@/shared/actions/assetSrc'
import { cn } from '@/shared/lib/cn'
import type { TemplateSummary } from '../types'

interface Props {
  template: TemplateSummary
  /** chamado quando a folha aparece na tela e ainda não tem miniatura */
  onRequestPreview: (templateId: string) => void
  /** proporção real da folha (largura/altura) quando a imagem carrega: folhas em paisagem não são cortadas */
  onRatio?: (ratio: number) => void
  className?: string
}

/** Uma folha (A4 retrato) com a miniatura do modelo; sem imagem, mostra linhas de "texto" pulsando até a geração terminar. */
export const TemplateThumb = ({ template, onRequestPreview, onRatio, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const src = assetSrc(template.previewUrl)

  const handleObserve = () => {
    if (src || !ref.current) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onRequestPreview(template.id)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }
  useEffect(handleObserve, [src, template.id])

  return (
    <div ref={ref} className={cn('relative overflow-hidden rounded-[3px] bg-surface', className)} aria-hidden>
      {src ? (
        <>
          {!loaded && <div className="absolute inset-0 animate-pulse bg-surface-secondary" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            loading="lazy"
            draggable={false}
            onLoad={(e) => {
              setLoaded(true)
              onRatio?.(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)
            }}
            className={cn('absolute inset-0 size-full origin-[50%_4%] scale-[1.22] object-cover object-top transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
          />
        </>
      ) : (
        <div className="flex h-full animate-pulse flex-col gap-1.5 p-[12%]">
          <div className="h-1.5 w-2/3 rounded-full bg-surface-tertiary" />
          {[100, 92, 96, 70, 88, 60].map((w, i) => <div key={i} className="h-1 rounded-full bg-surface-secondary" style={{ width: `${w}%` }} />)}
        </div>
      )}
    </div>
  )
}
