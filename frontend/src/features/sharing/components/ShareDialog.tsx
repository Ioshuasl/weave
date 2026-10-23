'use client'

import { Check, Copy, Globe, Link2, Lock, Users, X } from 'lucide-react'
import { useState } from 'react'
import { ShareModeEnum, ShareModeHint, ShareModeLabel } from '@/shared/enums/ShareModeEnum'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import type { ShareSettings } from '../types'

const modeIcon = { OFF: Lock, PUBLIC: Globe, MEMBERS: Users } as const

interface Props {
  share: ShareSettings
  errorMessage: string | null
  onSave: (mode: ShareModeEnum, allowCopy: boolean) => Promise<boolean>
  onClose: () => void
}

/** Compartilhar por link (estilo "Publicar na web" do Notion): quem pode abrir e se pode usar o modelo. Salva a cada escolha. */
export const ShareDialog = ({ share, errorMessage, onSave, onClose }: Props) => {
  const [isCopied, setIsCopied] = useState(false)
  const isOn = share.mode !== ShareModeEnum.OFF
  const link = share.token ? `${window.location.origin}/s/${share.token}` : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      /* sem permissão da área de transferência: o campo continua selecionável */
    }
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="share-title" className="flex items-center gap-2 text-md font-semibold"><Link2 className="size-4" aria-hidden />Compartilhar modelo</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>
        <div className="flex flex-col gap-4 p-4">
          {errorMessage && <Alert>{errorMessage}</Alert>}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Quem pode abrir o link</legend>
            {Object.values(ShareModeEnum).map((mode) => {
              const Icon = modeIcon[mode]
              const selected = share.mode === mode
              return (
                <label key={mode} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring', selected ? 'border-primary-border bg-primary-subtle' : 'border-border hover:bg-surface-hover')}>
                  <input type="radio" name="share-mode" className="sr-only" checked={selected} onChange={() => onSave(mode, mode === ShareModeEnum.OFF ? false : share.allowCopy)} />
                  <Icon className={cn('mt-0.5 size-4 shrink-0', selected ? 'text-primary' : 'text-fg-muted')} aria-hidden />
                  <span>
                    <span className="block text-sm font-medium">{ShareModeLabel[mode]}</span>
                    <span className="block text-xs text-fg-secondary">{ShareModeHint[mode]}</span>
                  </span>
                </label>
              )
            })}
          </fieldset>

          {isOn && (
            <>
              <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border p-3">
                <span>
                  <span className="block text-sm font-medium">Permitir “Usar este modelo”</span>
                  <span className="block text-xs text-fg-secondary">Quem abrir o link poderá criar uma cópia editável na própria conta. A sua versão não é alterada.</span>
                </span>
                <input type="checkbox" role="switch" checked={share.allowCopy} onChange={(e) => onSave(share.mode, e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]" />
              </label>

              <div>
                <label htmlFor="share-link" className="mb-1 block text-sm font-medium">Link</label>
                <div className="flex gap-2">
                  <input id="share-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="h-9 min-w-0 flex-1 rounded-md border border-input-border bg-surface-secondary px-3 text-sm text-fg-secondary" />
                  <Button variant="secondary" onClick={handleCopyLink}>{isCopied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{isCopied ? 'Copiado' : 'Copiar'}</Button>
                </div>
                <p className="mt-2 text-xs text-fg-muted">Quem abre o link vê o layout e os dados de exemplo deste modelo. Os dados reais da sua conta nunca são compartilhados. Para encerrar, escolha “Não compartilhado”.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
