import { User } from 'lucide-react'
import { avatarSrc } from '@/shared/actions/avatarSrc'
import { cn } from '@/shared/lib/cn'

export const Avatar = ({ avatarUrl, className, iconClassName }: { avatarUrl?: string | null; className?: string; iconClassName?: string }) => {
  const src = avatarSrc(avatarUrl)
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-secondary text-fg-secondary', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" draggable={false} className="size-full object-cover" />
      ) : (
        <User className={cn('size-4', iconClassName)} aria-hidden />
      )}
    </span>
  )
}
