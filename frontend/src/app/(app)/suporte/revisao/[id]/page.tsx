import { SubmissionReview } from '@/features/support/components/SubmissionReview'

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SubmissionReview id={id} />
}
