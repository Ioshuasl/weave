import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export const Card = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-lg border border-border bg-surface p-4', className)} {...rest} />
)
