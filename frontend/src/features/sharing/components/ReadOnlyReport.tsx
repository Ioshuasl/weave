'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { DataSourceCatalog } from '@/packages/weave'
import { createEmptyReport } from '@/packages/weave/modules/report/domain'
import { defaultPageVariables } from '@/shared/actions/defaultPageVariables'
import { isReportDefinition } from '@/shared/actions/isReportDefinition'
import { Skeleton } from '@/shared/ui/Skeleton'
import type { PreviewableTemplate } from '../types'

const Weave = dynamic(() => import('@/packages/weave').then((m) => m.Weave), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> })

/** Pré-visualização (somente leitura) de um modelo com os dados de exemplo dele — usada na página pública e na revisão do suporte. */
export const ReadOnlyReport = ({ template, reportId }: { template: PreviewableTemplate; reportId: string }) => {
  const report = useMemo(
    () => (isReportDefinition(template.document) ? { ...template.document, id: reportId, name: template.name } : createEmptyReport({ id: reportId, name: template.name })),
    [template, reportId],
  )
  const dataSources = useMemo<DataSourceCatalog>(
    () => Object.fromEntries(Object.entries(template.mockData).map(([k, rows]) => [k, { kind: rows.length > 1 ? 'list' : 'singleton' }])),
    [template.mockData],
  )
  return <Weave reportId={reportId} reportName={template.name} mode="preview" report={report} data={template.mockData} dataSources={dataSources} resolvePageVariables={defaultPageVariables} className="h-full w-full" />
}
