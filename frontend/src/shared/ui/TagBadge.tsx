import { X } from 'lucide-react'
import { TagColorClasses, type TagColorEnum } from '@/shared/enums/TagColorEnum'
import { cn } from '@/shared/lib/cn'

interface Props {
  name: string
  color: TagColorEnum
  className?: string
  /** quando informado, mostra o "×" para remover (campo de tags) */
  onRemove?: () => void
}

/** Tag colorida estilo Notion. */
export const TagBadge = ({ name, color, className, onRemove }: Props) => (
  <span className={cn('inline-flex max-w-full items-center gap-1 rounded-sm px-1.5 py-0.5 text-sm font-medium leading-5', TagColorClasses[color], className)}>
    <span className="truncate">{name}</span>
    {onRemove && (
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Remover tag ${name}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
        className="-mr-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-3" aria-hidden />
      </button>
    )}
  </span>
)
