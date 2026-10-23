'use client'

import { useCallback, useRef, useState } from 'react'
import type { AssistantRequest, AssistantResponse, ReportDefinition, WeaveSavePayload } from '@/packages/weave'
import { createEmptyReport } from '@/packages/weave/modules/report/domain'
import { assistantService } from '@/features/assistant/services/assistant.service'
import { templatesService } from '@/features/templates/services/templates.service'
import type { MockDataset, TemplateDetail } from '@/features/templates/types'
import { captureReportPreview } from '@/shared/actions/captureReportPreview'
import { isReportDefinition } from '@/shared/actions/isReportDefinition'
import { ApiError } from '@/shared/lib/api'

export const useTemplateEditorHook = (templateId: string, datasetId: string | null, isSupport = false) => {
  const [template, setTemplate] = useState<TemplateDetail | null>(null)
  const [report, setReport] = useState<ReportDefinition | null>(null)
  const [dataset, setDataset] = useState<MockDataset | null>(null)
  const [assistantEnabled, setAssistantEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [assistantError, setAssistantError] = useState<string | null>(null)
  /** pedido do assistente que gerou alterações ainda não salvas (para rotular a versão) */
  const pendingAssistantRequest = useRef<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      const [detail, datasets, assistant] = await Promise.all([
        templatesService.get(templateId),
        templatesService.listDatasets(templateId),
        assistantService.status().catch(() => ({ enabled: false })),
      ])
      setTemplate(detail)
      setReport(
        isReportDefinition(detail.document)
          ? { ...detail.document, id: templateId, name: detail.name }
          : createEmptyReport({ id: templateId, name: detail.name }),
      )
      setDataset(datasets.find((d) => d.id === datasetId) ?? datasets.find((d) => d.isDefault) ?? datasets[0] ?? null)
      setAssistantEnabled(assistant.enabled && (!detail.isSystem || isSupport))
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível abrir o modelo.')
    } finally {
      setIsLoading(false)
    }
  }, [templateId, datasetId, isSupport])

  const handleSave = async (payload: WeaveSavePayload) => {
    const fromAssistant = pendingAssistantRequest.current
    await templatesService.saveDocument(
      templateId,
      payload.report as unknown as Record<string, unknown>,
      fromAssistant ? `Assistente de IA: ${fromAssistant}`.slice(0, 200) : 'Edição no editor',
      fromAssistant ? 'ASSISTANT' : 'MANUAL',
    )
    pendingAssistantRequest.current = null
    // miniatura da galeria: gerada a cada salvamento, sem bloquear o "Salvo" (falha não afeta o modelo)
    handleRefreshPreview(payload.report, payload.data)
  }

  const handleRefreshPreview = async (report: ReportDefinition, data: Record<string, unknown[]>) => {
    try {
      await templatesService.uploadPreview(templateId, await captureReportPreview(report, data))
    } catch {
      /* a galeria gera sob demanda se faltar */
    }
  }

  /** `null` = falha já tratada aqui (banner), como o painel do Weave espera. */
  const handleAssistantRequest = async (request: AssistantRequest): Promise<AssistantResponse | null> => {
    setAssistantError(null)
    try {
      const reply = await assistantService.send(templateId, request)
      if (reply.acoes.length > 0 || reply.confirmacao) pendingAssistantRequest.current = request.pedido
      return reply
    } catch (err) {
      setAssistantError(err instanceof ApiError ? err.message : 'Não foi possível falar com o assistente. Tente novamente.')
      return null
    }
  }

  return {
    template, report, dataset, assistantEnabled, isLoading, errorMessage, assistantError,
    executeLoad, handleSave, handleAssistantRequest, handleDismissAssistantError: () => setAssistantError(null),
  }
}
