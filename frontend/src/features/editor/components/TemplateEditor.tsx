'use client'

import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import type { DataSourceCatalog } from '@/packages/weave'
import { defaultPageVariables } from '@/shared/actions/defaultPageVariables'
import { Alert } from '@/shared/ui/Alert'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useTemplateEditorHook } from '../hooks/useTemplateEditorHook'

const Weave = dynamic(() => import('@/packages/weave').then((m) => m.Weave), {
  ssr: false,
  loading: () => <EditorSkeleton />,
})

function EditorSkeleton() {
  return (
    <div className="flex h-dvh flex-col">
      <Skeleton className="h-14 rounded-none" />
      <div className="flex flex-1 gap-px">
        <Skeleton className="w-60 rounded-none" />
        <Skeleton className="flex-1 rounded-none" />
        <Skeleton className="w-72 rounded-none" />
      </div>
    </div>
  )
}

export const TemplateEditor = ({ templateId }: { templateId: string }) => {
  const router = useRouter()
  const params = useSearchParams()
  const { status, accountId, user } = useAuth()
  const isSupport = user?.platformRole === 'SUPPORT'
  const requestedMode = params.get('mode') === 'preview' ? 'preview' : 'design'
  const e = useTemplateEditorHook(templateId, params.get('dataset'), isSupport)

  useEffect(() => {
    if (status === 'anonymous') router.replace('/login')
    if (status === 'authenticated' && user?.mustChangePassword) router.replace('/')
    else if (status === 'authenticated') e.executeLoad()
  }, [status, accountId, e.executeLoad])

  const dataSources = useMemo<DataSourceCatalog>(
    () => Object.fromEntries(Object.entries(e.dataset?.data ?? {}).map(([k, rows]) => [k, { kind: rows.length > 1 ? 'list' : 'singleton' }])),
    [e.dataset],
  )

  if (e.isLoading || !e.template || !e.report) {
    return e.errorMessage ? <div className="p-6"><Alert>{e.errorMessage}</Alert></div> : <EditorSkeleton />
  }

  const mode = e.template.isSystem && !isSupport ? 'preview' : requestedMode

  return (
    <div className="h-dvh w-full">
      <Weave
        key={`${templateId}-${e.dataset?.id ?? 'sem-dados'}-${mode}`}
        reportId={templateId}
        reportName={e.template.name}
        mode={mode}
        report={e.report}
        data={e.dataset?.data ?? {}}
        dataSources={dataSources}
        resolvePageVariables={defaultPageVariables}
        onClose={() => router.push(`/modelos/${templateId}`)}
        onSave={mode === 'design' ? e.handleSave : undefined}
        onAssistantRequest={mode === 'design' && e.assistantEnabled ? e.handleAssistantRequest : undefined}
        assistantImages
        assistantUsage
        className="h-full w-full"
      />
      {e.assistantError && (
        <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
          <Alert>
            <span className="flex items-start justify-between gap-3">
              {e.assistantError}
              <button type="button" onClick={e.handleDismissAssistantError} className="shrink-0 font-medium underline">Fechar</button>
            </span>
          </Alert>
        </div>
      )}
    </div>
  )
}
