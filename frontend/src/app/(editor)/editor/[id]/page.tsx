import { Suspense } from 'react'
import { TemplateEditor } from '@/features/editor/components/TemplateEditor'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense>
      <TemplateEditor templateId={id} />
    </Suspense>
  )
}
