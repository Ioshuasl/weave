'use client'

import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { FieldShell } from '@/shared/ui/Field'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

/** Campo de senha com botão "mostrar" (o dono precisa conferir o que digita antes de repassar). */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(({ label, error, hint, id, ...rest }, ref) => {
  const auto = useId()
  const htmlFor = id ?? auto
  const [visible, setVisible] = useState(false)
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={htmlFor}>
      <div className="relative">
        <input
          ref={ref}
          id={htmlFor}
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          className="h-9 w-full rounded-md border border-input-border bg-surface px-3 pr-10 text-base text-foreground hover:border-border-strong"
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-secondary"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    </FieldShell>
  )
})
PasswordInput.displayName = 'PasswordInput'
