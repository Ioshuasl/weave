'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/members.schemas'
import type { Member } from '../types'
import { PasswordInput } from './PasswordInput'

interface Props {
  member: Member
  onClose: () => void
  onReset: (membershipId: string, temporaryPassword: string) => Promise<string | null>
}

export const ResetPasswordDialog = ({ member, onClose, onReset }: Props) => {
  const { register, handleSubmit, formState } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { temporaryPassword: '' },
  })
  const { errors, isSubmitting } = formState
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleForm = handleSubmit(async (values) => {
    setError(null)
    const failure = await onReset(member.membershipId, values.temporaryPassword)
    if (failure) setError(failure)
    else setDone(true)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="reset-title" className="text-md font-semibold">Redefinir senha de {member.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>
        {done ? (
          <div className="flex flex-col gap-4 p-4">
            <Alert tone="success">Senha provisória definida. {member.name} foi desconectado(a) e precisará trocá-la no próximo acesso (vale por 7 dias).</Alert>
            <footer className="flex justify-end"><Button onClick={onClose}>Concluir</Button></footer>
          </div>
        ) : (
          <form onSubmit={handleForm} noValidate className="flex flex-col gap-4 p-4">
            {error && <Alert>{error}</Alert>}
            <p className="text-sm text-fg-secondary">Defina uma nova senha provisória e repasse a {member.name} por um canal seguro. Todas as sessões atuais serão encerradas.</p>
            <PasswordInput label="Nova senha provisória" hint="Mínimo de 8 caracteres" error={errors.temporaryPassword?.message} {...register('temporaryPassword')} />
            <footer className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button type="submit" loading={isSubmitting}>Redefinir senha</Button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
