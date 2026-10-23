'use client'

import { Laptop } from 'lucide-react'
import { useEffect } from 'react'
import { formatDate } from '@/shared/actions/formatDate'
import { formatIp } from '@/shared/actions/formatIp'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { InputField } from '@/shared/ui/Field'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useSecurityHook } from '../hooks/useSecurityHook'

/** "Chrome em Linux" a partir do user-agent (exibição amigável). */
const describeAgent = (ua: string | null) => {
  if (!ua) return 'Dispositivo desconhecido'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Navegador'
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'sistema desconhecido'
  return `${browser} em ${os}`
}

export const SecuritySection = () => {
  const s = useSecurityHook()
  const { register, formState } = s.form
  const { errors, isSubmitting } = formState

  useEffect(() => {
    s.executeLoadSessions()
  }, [s.executeLoadSessions])

  return (
    <div className="space-y-4">
      {s.message && <Alert tone={s.message.tone}>{s.message.text}</Alert>}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <form onSubmit={s.handleSubmit} noValidate className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-md font-semibold">Alterar senha</h3>
            <p className="text-xs text-fg-muted">Ao trocar a senha, os outros dispositivos são desconectados.</p>
          </div>
          <div className="grid gap-x-5 gap-y-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><InputField label="Senha atual" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} /></div>
            <InputField label="Nova senha" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres" error={errors.newPassword?.message} {...register('newPassword')} />
            <InputField label="Confirmar nova senha" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          </div>
          <footer className="flex justify-end border-t border-border bg-surface-secondary px-5 py-3">
            <Button type="submit" loading={isSubmitting}>Alterar senha</Button>
          </footer>
        </form>

        <section className="overflow-hidden rounded-xl border border-border bg-surface" aria-label="Sessões ativas">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-md font-semibold">Sessões ativas</h3>
            <p className="text-xs text-fg-muted">Dispositivos conectados à sua conta.</p>
          </div>
          {s.isLoading ? (
            <div className="space-y-2 p-5"><Skeleton className="h-5 w-56" /><Skeleton className="h-4 w-40" /></div>
          ) : (
            <ul className="divide-y divide-border">
              {s.sessions.map((session) => (
                <li key={session.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Laptop className="size-4 shrink-0 text-fg-muted" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base">{describeAgent(session.userAgent)}</p>
                    <p className="truncate text-xs text-fg-muted">{formatIp(session.ip)} · desde {formatDate(session.createdAt)}</p>
                  </div>
                  {session.current ? <Badge tone="success">Este dispositivo</Badge> : <Button variant="secondary" size="sm" onClick={() => s.handleRevoke(session.id)}>Encerrar</Button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
