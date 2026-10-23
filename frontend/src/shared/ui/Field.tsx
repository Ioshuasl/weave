import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const control =
  'h-9 w-full rounded-md border border-input-border bg-surface px-3 text-base text-foreground placeholder:text-placeholder ' +
  'transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-fg-muted'

interface FieldShellProps {
  label: string
  error?: string
  hint?: string
  htmlFor: string
  children: ReactNode
}

export const FieldShell = ({ label, error, hint, htmlFor, children }: FieldShellProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-destructive" role="alert">{error}</p>
    ) : hint ? (
      <p className="text-xs text-fg-muted">{hint}</p>
    ) : null}
  </div>
)

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const auto = useId()
    const htmlFor = id ?? auto
    return (
      <FieldShell label={label} error={error} hint={hint} htmlFor={htmlFor}>
        <input
          ref={ref}
          id={htmlFor}
          aria-invalid={Boolean(error)}
          className={cn(control, error && 'border-destructive', className)}
          {...rest}
        />
      </FieldShell>
    )
  },
)
InputField.displayName = 'InputField'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, className, id, children, ...rest }, ref) => {
    const auto = useId()
    const htmlFor = id ?? auto
    return (
      <FieldShell label={label} error={error} htmlFor={htmlFor}>
        <div className="relative">
          <select
            ref={ref}
            id={htmlFor}
            aria-invalid={Boolean(error)}
            className={cn(control, 'appearance-none pr-8', error && 'border-destructive', className)}
            {...rest}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
        </div>
      </FieldShell>
    )
  },
)
SelectField.displayName = 'SelectField'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({ label, error, hint, className, id, ...rest }, ref) => {
  const auto = useId()
  const htmlFor = id ?? auto
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={htmlFor}>
      <textarea ref={ref} id={htmlFor} aria-invalid={Boolean(error)} rows={3} className={cn(control, 'h-auto resize-none py-2', error && 'border-destructive', className)} {...rest} />
    </FieldShell>
  )
})
TextareaField.displayName = 'TextareaField'
