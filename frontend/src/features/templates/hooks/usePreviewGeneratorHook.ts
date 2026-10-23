'use client'

import { useRef } from 'react'
import { captureReportPreview } from '@/shared/actions/captureReportPreview'
import { isReportDefinition } from '@/shared/actions/isReportDefinition'
import { templatesService } from '../services/templates.service'

/** modelos que já tentamos (com ou sem sucesso) nesta sessão: evita laço de tentativas */
const attempted = new Set<string>()

/**
 * Geração sob demanda das miniaturas: cards sem imagem pedem aqui quando entram na tela.
 * Uma por vez (para não travar a página); ao terminar avisa a galeria para trocar o ícone pela imagem.
 */
export const usePreviewGeneratorHook = (onReady: (templateId: string, previewUrl: string) => void) => {
  const queue = useRef<string[]>([])
  const running = useRef(false)

  const handleProcess = async () => {
    if (running.current) return
    running.current = true
    while (queue.current.length > 0) {
      const id = queue.current.shift()!
      try {
        const [detail, datasets] = await Promise.all([templatesService.get(id), templatesService.listDatasets(id)])
        if (!isReportDefinition(detail.document)) continue
        const data = (datasets.find((d) => d.isDefault) ?? datasets[0])?.data ?? {}
        const { previewUrl } = await templatesService.uploadPreview(id, await captureReportPreview(detail.document, data))
        onReady(id, previewUrl)
      } catch {
        /* sem miniatura por enquanto: o card mantém o ícone */
      }
    }
    running.current = false
  }

  const handleRequest = (templateId: string) => {
    if (attempted.has(templateId)) return
    attempted.add(templateId)
    queue.current.push(templateId)
    handleProcess()
  }

  return { handleRequest }
}
