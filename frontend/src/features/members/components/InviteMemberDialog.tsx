'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { MemberRoleHint, MemberRoleLabel } from '@/shared/enums/MemberRoleEnum'
import { Button } from '@/shared/ui/Button'
import { InputField, SelectField } from '@/shared/ui/Field'
import { inviteSchema, type InviteFormValues } from '../schemas/members.schemas'

const ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const

interface Props {
  onClose: () => void
  onInvite: (values: InviteFormValues) => Promise<boolean>
}

export const InviteMemberDialog = ({ onClose, onInvite }: Props) => {
  const { register, handleSubmit, watch, formState } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'EDITOR' },
  })
  const { errors, isSubmitting } = formState

  const handleForm = handleSubmit(async (values) => {
    if (await onInvite(values)) onClose()
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="invite-title" className="text-md font-semibold">Convidar funcionário</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>
        <form onSubmit={handleForm} noValidate className="flex flex-col gap-4 p-4">
          <InputField label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          <SelectField label="Papel" error={errors.role?.message} {...register('role')}>
            {ROLES.map((r) => <option key={r} value={r}>{MemberRoleLabel[r]}</option>)}
          </SelectField>
          <p className="text-xs text-fg-muted">{MemberRoleHint[watch('role')]}</p>
          <footer className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Enviar convite</Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
