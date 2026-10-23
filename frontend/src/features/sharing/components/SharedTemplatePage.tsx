'use client'

import { Copy, Lock, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PersonChip } from '@/shared/ui/PersonChip'
import { RelativeTime } from '@/shared/ui/RelativeTime'
import { Skeleton } from '@/shared/ui/Skeleton'
import { TagBadge } from '@/shared/ui/TagBadge'
import { WeaveLogo } from '@/shared/ui/WeaveLogo'
import { useSharedTemplateHook } from '../hooks/useSharedTemplateHook'
import { ReadOnlyReport } from './ReadOnlyReport'

/** Página aberta pelo link de compartilhamento: visualização somente leitura + "Usar este modelo" (se o autor permitiu). */
export const SharedTemplatePage = ({ token }: { token: string }) => {
  const { status } = useAuth()
  const s = useSharedTemplateHook(token)
  const isAuthenticated = status === 'authenticated'

  // espera a sessão ser conhecida: link "só com conta" precisa do token de acesso
  useEffect(() => {
    if (status !== 'loading') s.executeLoad()
  }, [status, s.executeLoad])

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <Link href="/" aria-label="Weave"><WeaveLogo /></Link>
        {s.template && (
          <div className="ml-2 min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.template.name}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-fg-muted">
              {s.template.author && <><PersonChip name={s.template.author.name} avatarUrl={s.template.author.avatarUrl} /> · </>}
              <RelativeTime value={s.template.updatedAt} prefix="atualizado" />
              {s.template.tags.slice(0, 3).map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} className="ml-1 text-xs" />)}
            </p>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {s.template?.allowCopy && (isAuthenticated ? (
            <Button loading={s.isCopying} onClick={s.handleUse}><Copy className="size-4" aria-hidden />Usar este modelo</Button>
          ) : (
            <Button onClick={() => s.handleGoToAuth('/login')}><LogIn className="size-4" aria-hidden />Entrar para usar este modelo</Button>
          ))}
          {!isAuthenticated && status !== 'loading' && <Button variant="secondary" onClick={() => s.handleGoToAuth('/cadastro')}>Criar conta</Button>}
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {s.isLoading || status === 'loading' ? (
          <div className="p-6"><Skeleton className="h-full min-h-[24rem] w-full" /></div>
        ) : s.isLoginRequired ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-secondary text-fg-muted"><Lock className="size-6" aria-hidden /></span>
            <div>
              <h1 className="text-lg font-semibold">Modelo compartilhado só com quem tem conta</h1>
              <p className="mt-1 text-sm text-fg-secondary">Entre ou crie uma conta gratuita no Weave para visualizar este modelo.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => s.handleGoToAuth('/login')}>Entrar</Button>
              <Button variant="secondary" onClick={() => s.handleGoToAuth('/cadastro')}>Criar conta</Button>
            </div>
          </div>
        ) : s.errorMessage || !s.template ? (
          <div className="mx-auto max-w-md px-4 py-20"><Alert>{s.errorMessage ?? 'Este link não está mais disponível.'}</Alert></div>
        ) : (
          <>
            {s.errorMessage && <div className="p-3"><Alert>{s.errorMessage}</Alert></div>}
            <ReadOnlyReport template={s.template} reportId={token} />
          </>
        )}
      </main>
    </div>
  )
}
