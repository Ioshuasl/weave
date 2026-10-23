import type { ReportDefinition } from '@/packages/weave'
import { defaultPageVariables } from './defaultPageVariables'

const PREVIEW_WIDTH_PX = 560

/**
 * Renderiza a 1ª folha do relatório (com os dados informados) fora da tela e devolve uma imagem PNG leve (~20–30 KB). O motor e o rasterizador são carregados sob demanda: a galeria só paga o custo quando precisa gerar.
 */
export const captureReportPreview = async (designReport: ReportDefinition, designData: Record<string, unknown[]>): Promise<Blob> => {
  const [{ createElement }, { createRoot }, { flushSync }, { toBlob }, engine, sheetModule, expression, infra, dataSource] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('react-dom'),
    import('html-to-image'),
    import('@/packages/weave/modules/rendering/domain/paginationEngine'),
    import('@/packages/weave/modules/rendering/ui/ReportPageSheet'),
    import('@/packages/weave/modules/expression/domain'),
    import('@/packages/weave/modules/rendering/infrastructure'),
    import('@/packages/weave/modules/data-source/domain'),
  ])

  // mesma preparação da pré-visualização: listas aninhadas viram fontes ligadas e os cálculos nomeados são expandidos
  const report = expression.expandCalculos(designReport)
  const data = dataSource.flattenNestedData(designData, undefined)?.data ?? designData

  const sheet = engine.buildReportPreviewSheets(report, data)[0]
  const page = sheet && (report.pages.find((p) => p.id === sheet.designPageId) ?? report.pages[0])
  if (!sheet || !page) throw new Error('Relatório sem folhas para pré-visualizar.')

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;'
  document.body.appendChild(host)
  const root = createRoot(host)
  try {
    flushSync(() =>
      root.render(
        createElement(sheetModule.ReportPageSheet, {
          page,
          bands: report.bands,
          components: report.components,
          data,
          contentWidth: sheet.contentWidth,
          contentHeight: sheet.contentHeight,
          layers: sheet.layers,
          sysContext: expression.buildSystemVariables({
            globalPageNumber: sheet.globalPageNumber,
            globalTotalPages: sheet.globalTotalPages,
            outputPageNumber: sheet.outputPageNumber,
            outputTotalPages: sheet.outputTotalPages,
            reportName: report.name,
            resolvePageVariables: defaultPageVariables,
          }),
        }),
      ),
    )
    await document.fonts.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    const node = host.firstElementChild as HTMLElement | null
    if (!node) throw new Error('Não foi possível desenhar a folha.')
    await infra.waitForElementImages(node)

    const blob = await toBlob(node, {
      pixelRatio: PREVIEW_WIDTH_PX / page.width,
      backgroundColor: '#ffffff',
    })
    if (!blob) throw new Error('Não foi possível gerar a imagem.')
    return blob
  } finally {
    root.unmount()
    host.remove()
  }
}
