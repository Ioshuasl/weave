'use client'

import { useAuth } from '@/features/auth/components/AuthProvider'
import { formatDateTime, formatRelativeTime } from '@/shared/actions/formatRelativeTime'
import { useNow } from '@/shared/lib/useNow'

/** "agora", "há 2h" ou "em 21/10/2026 às 12:31" (fuso do usuário); o texto completo fica no `title`. */
export const RelativeTime = ({ value, prefix, className }: { value: string; prefix?: string; className?: string }) => {
  const { user } = useAuth()
  const now = useNow()
  return (
    <time dateTime={value} title={formatDateTime(value, user?.timezone)} className={className}>
      {prefix ? `${prefix} ` : ''}{formatRelativeTime(value, now, user?.timezone)}
    </time>
  )
}
