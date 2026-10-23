'use client'

import { Button } from '@/shared/ui/Button'

interface Props {
  title: string
  description: string
  confirmLabel: string
  loading?: boolean
  /** 'primary' para ações seguras (ex.: restaurar); padrão destrutivo */
  tone?: 'destructive' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({ title, description, confirmLabel, loading, tone = 'destructive', onConfirm, onCancel }: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-4 shadow-lg">
      <h2 id="confirm-title" className="text-md font-semibold">{title}</h2>
      <p className="mt-1 text-base text-fg-secondary">{description}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant={tone === 'primary' ? 'primary' : 'destructive'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </div>
)
