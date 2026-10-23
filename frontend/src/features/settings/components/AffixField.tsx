import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { FieldShell } from '@/shared/ui/Field'
import { cn } from '@/shared/lib/cn'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** texto fixo antes do valor (ex.: "@", "https://") */
  prefix: string
  error?: string
  hint?: string
}

/** Campo com prefixo fixo, no mesmo visual do `InputField`. */
export const AffixField = forwardRef<HTMLInputElement, Props>(({ label, prefix, error, hint, id, className, ...rest }, ref) => {
  const auto = useId()
  const htmlFor = id ?? auto
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={htmlFor}>
      <div className={cn('flex h-9 items-center rounded-md border border-input-border bg-surface px-3 transition-colors hover:border-border-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring', error && 'border-destructive', className)}>
        <span className="mr-1 select-none text-fg-muted" aria-hidden>{prefix}</span>
        <input ref={ref} id={htmlFor} aria-invalid={Boolean(error)} className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder" {...rest} />
      </div>
    </FieldShell>
  )
})
AffixField.displayName = 'AffixField'
