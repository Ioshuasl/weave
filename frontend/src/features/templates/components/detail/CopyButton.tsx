'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

/** Copia um texto (ex.: `{pessoas.nome}`) e confirma com um ✓ rápido. */
export const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button type="button" onClick={handleCopy} aria-label={label} title={label} className="flex size-5 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-surface-tertiary hover:text-foreground">
      {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
    </button>
  )
}
