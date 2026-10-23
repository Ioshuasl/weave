import { SharedTemplatePage } from '@/features/sharing/components/SharedTemplatePage'

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <SharedTemplatePage token={token} />
}
