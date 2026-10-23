import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export const Skeleton = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('animate-pulse rounded-md bg-surface-tertiary', className)} aria-hidden {...rest} />
)
