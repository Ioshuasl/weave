'use client'

import { KeyRound, Link2, Mail, Trash2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { formatDate } from '@/shared/actions/formatDate'
import { getTempPasswordStatus } from '@/shared/actions/getTempPasswordStatus'
import { MemberRoleLabel } from '@/shared/enums/MemberRoleEnum'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useMembersHook } from '../hooks/useMembersHook'
import type { Member } from '../types'
import { useManagedMembersHook } from '../hooks/useManagedMembersHook'
import { CreateMemberDialog } from './CreateMemberDialog'
import { InviteMemberDialog } from './InviteMemberDialog'
import { ResetPasswordDialog } from './ResetPasswordDialog'

const MembersSkeleton = () => (
  <Card className="divide-y divide-border p-0">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
    ))}
  </Card>
)

export const MembersIndex = () => {
  const router = useRouter()
  const { activeMembership } = useAuth()
  const { members, invitations, isLoading, errorMessage, executeLoad, handleInvite, handleChangeRole, handleRemove, handleRevoke } =
    useMembersHook()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<Member | null>(null)
  const managed = useManagedMembersHook(executeLoad)

  useEffect(() => {
    executeLoad()
  }, [executeLoad])

  const isCompany = activeMembership?.accountType === 'COMPANY'

  // conta pessoal não tem equipe: quem chegar pela URL volta para a página inicial
  const handleRedirectPersonal = () => {
    if (activeMembership && !isCompany) router.replace('/')
  }
  useEffect(handleRedirectPersonal, [activeMembership?.accountType])
  const canManage = activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN'

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Equipe</h1>
          <p className="text-base text-fg-secondary">Funcionários que operam os relatórios desta conta.</p>
        </div>
        {isCompany && canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setIsInviteOpen(true)}><Link2 className="size-4" aria-hidden />Convidar por link</Button>
            <Button onClick={() => setIsCreateOpen(true)}><UserPlus className="size-4" aria-hidden />Cadastrar funcionário</Button>
          </div>
        )}
      </div>

      {errorMessage && <div className="mt-4"><Alert>{errorMessage}</Alert></div>}

      <section className="mt-6" aria-label="Membros">
        {isLoading ? (
          <MembersSkeleton />
        ) : (
          <Card className="divide-y divide-border p-0">
            {members.map((m) => {
              const editable = canManage && m.role !== 'OWNER' && (m.role !== 'ADMIN' || activeMembership?.role === 'OWNER')
              return (
                <div key={m.membershipId} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary" aria-hidden>
                    {m.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">{m.name}</p>
                    <p className="truncate text-sm text-fg-muted">{m.email} · desde {formatDate(m.createdAt)}</p>
                    {getTempPasswordStatus(m) === 'ACTIVE' && <Badge tone="warning" className="mt-1">Aguardando o primeiro acesso</Badge>}
                    {getTempPasswordStatus(m) === 'EXPIRED' && <Badge tone="warning" className="mt-1">Senha provisória vencida — redefina</Badge>}
                  </div>
                  {editable ? (
                    <>
                      <select
                        aria-label={`Papel de ${m.name}`}
                        value={m.role}
                        onChange={(e) => handleChangeRole(m.membershipId, e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER')}
                        className="h-8 rounded-md border border-input-border bg-surface px-2 text-sm"
                      >
                        {(['ADMIN', 'EDITOR', 'VIEWER'] as const).map((r) => (
                          <option key={r} value={r} disabled={r === 'ADMIN' && activeMembership?.role !== 'OWNER'}>{MemberRoleLabel[r]}</option>
                        ))}
                      </select>
                      {m.managed && (
                        <Button variant="ghost" size="sm" onClick={() => setResetTarget(m)} aria-label={`Redefinir senha de ${m.name}`} title="Redefinir senha"><KeyRound className="size-4" aria-hidden /></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(m.membershipId)} aria-label={`Remover ${m.name}`}>
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </>
                  ) : (
                    <Badge tone={m.role === 'OWNER' ? 'primary' : 'neutral'}>{MemberRoleLabel[m.role]}</Badge>
                  )}
                </div>
              )
            })}
          </Card>
        )}
      </section>

      {!isLoading && invitations.length > 0 && (
        <section className="mt-8" aria-label="Convites pendentes">
          <h2 className="mb-2 text-lg font-semibold">Convites pendentes</h2>
          <Card className="divide-y divide-border p-0">
            {invitations.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                <Mail className="size-4 text-fg-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base">{i.email}</p>
                  <p className="text-sm text-fg-muted">{MemberRoleLabel[i.role]} · expira em {formatDate(i.expiresAt)}</p>
                </div>
                <Badge tone="warning">Pendente</Badge>
                <Button variant="ghost" size="sm" onClick={() => handleRevoke(i.id)}>Revogar</Button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {isCreateOpen && <CreateMemberDialog canGrantAdmin={activeMembership?.role === 'OWNER'} onClose={() => setIsCreateOpen(false)} onCreate={managed.handleCreate} />}
      {resetTarget && <ResetPasswordDialog member={resetTarget} onClose={() => setResetTarget(null)} onReset={managed.handleReset} />}
      {isInviteOpen && <InviteMemberDialog onClose={() => setIsInviteOpen(false)} onInvite={handleInvite} />}
    </div>
  )
}
