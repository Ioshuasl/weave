import { avatarSrc } from '@/shared/actions/avatarSrc'
import { formatInitials } from '@/shared/actions/formatInitials'
import { cn } from '@/shared/lib/cn'

interface Props {
  name: string | null
  avatarUrl?: string | null
  /** texto quando não há pessoa (ex.: "Sistema") */
  fallback?: string
  className?: string
  title?: string
}

/** Miniatura redonda (foto ou iniciais) + nome — quem criou/editou algo. */
export const PersonChip = ({ name, avatarUrl, fallback = 'Sistema', className, title }: Props) => {
  const src = avatarSrc(avatarUrl)
  return (
    <span title={title} className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-tertiary text-[10px] font-semibold text-fg-secondary" aria-hidden>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" draggable={false} className="size-full object-cover" />
        ) : name ? formatInitials(name) : '·'}
      </span>
      <span className="truncate">{name ?? fallback}</span>
    </span>
  )
}
