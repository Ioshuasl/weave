'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MemberRoleHint, MemberRoleLabel } from '@/shared/enums/MemberRoleEnum'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { InputField, SelectField } from '@/shared/ui/Field'
import { createMemberSchema, type CreateMemberFormValues } from '../schemas/members.schemas'
import { PasswordInput } from './PasswordInput'

const ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const

interface Props {
  /** o dono (ADMIN não pode criar outro ADMIN) */
  canGrantAdmin: boolean
  onClose: () => void
  onCreate: (values: CreateMemberFormValues) => Promise<string | null>
}

export const CreateMemberDialog = ({ canGrantAdmin, onClose, onCreate }: Props) => {
  const { register, handleSubmit, watch, formState } = useForm<CreateMemberFormValues>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: { name: '', email: '', role: 'EDITOR', temporaryPassword: '' },
  })
  const { errors, isSubmitting } = formState
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreateMemberFormValues | null>(null)
  const [copied, setCopied] = useState(false)

  const handleForm = handleSubmit(async (values) => {
    setError(null)
    const failure = await onCreate(values)
    if (failure) setError(failure)
    else setCreated(values)
  })

  const loginUrl = `${window.location.origin}/login`
  const credentials = created ? `Acesso ao Weave\nEndereço: ${loginUrl}\nE-mail: ${created.email}\nSenha provisória: ${created.temporaryPassword}\n(No primeiro acesso você definirá sua senha. A senha provisória vale por 7 dias.)` : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credentials)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="create-member-title">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="create-member-title" className="text-md font-semibold">{created ? 'Funcionário cadastrado' : 'Cadastrar funcionário'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>

        {created ? (
          <div className="flex flex-col gap-4 p-4">
            <Alert tone="success">{created.name} já pode entrar com a senha provisória e será levado(a) a definir a senha definitiva no primeiro acesso.</Alert>
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface-secondary p-3 font-mono text-xs text-foreground">{credentials}</pre>
            <p className="text-xs text-fg-muted">Esta é a única vez que a senha provisória aparece. Envie por um canal seguro.</p>
            <footer className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleCopy}>{copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? 'Copiado' : 'Copiar dados de acesso'}</Button>
              <Button onClick={onClose}>Concluir</Button>
            </footer>
          </div>
        ) : (
          <form onSubmit={handleForm} noValidate className="flex flex-col gap-4 p-4">
            {error && <Alert>{error}</Alert>}
            <InputField label="Nome" autoComplete="off" error={errors.name?.message} {...register('name')} />
            <InputField label="E-mail" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
            <SelectField label="Papel" error={errors.role?.message} {...register('role')}>
              {ROLES.map((r) => <option key={r} value={r} disabled={r === 'ADMIN' && !canGrantAdmin}>{MemberRoleLabel[r]}</option>)}
            </SelectField>
            <p className="-mt-2 text-xs text-fg-muted">{MemberRoleHint[watch('role')]}</p>
            <PasswordInput label="Senha provisória" hint="Mínimo de 8 caracteres. No primeiro acesso a pessoa será obrigada a trocá-la; vale por 7 dias." error={errors.temporaryPassword?.message} {...register('temporaryPassword')} />
            <footer className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button type="submit" loading={isSubmitting}>Cadastrar</Button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
