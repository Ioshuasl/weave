import { LessonPage } from '@/features/training/components/LessonPage'

export default async function LessonRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LessonPage lessonId={id} />
}
