'use client'

import { Building2, User } from 'lucide-react'
import Link from 'next/link'
import { AccountTypeEnum, AccountTypeLabel } from '@/shared/enums/AccountTypeEnum'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { AccountSegmentEnum, AccountSegmentLabel } from '@/shared/enums/AccountSegmentEnum'
import { InputField, SelectField } from '@/shared/ui/Field'
import { useRegisterFormHook } from '../hooks/useAuthFormHook'
import { AuthHeading } from './AuthHeading'

const typeIcon = { PERSONAL: User, COMPANY: Building2 } as const

/** Formulário de cadastro (sem moldura): o palco `AuthStage` decide onde e como ele aparece. */
export const RegisterFormBody = ({ showSwitchLink = true }: { showSwitchLink?: boolean }) => {
  const { form, errorMessage, handleSubmit } = useRegisterFormHook()
  const { register, watch, formState } = form
  const { errors, isSubmitting } = formState
  const accountType = watch('accountType')
  const isCompany = accountType === AccountTypeEnum.COMPANY

  return (
    <div className="w-full">
      <AuthHeading title="Criar conta" subtitle="Comece a criar relatórios em minutos." />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {errorMessage && <Alert>{errorMessage}</Alert>}

        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">Tipo de conta</legend>
          {Object.values(AccountTypeEnum).map((type) => {
            const Icon = typeIcon[type]
            const selected = accountType === type
            return (
              <label
                key={type}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                  selected ? 'border-primary-border bg-primary-subtle text-primary' : 'border-border bg-surface text-fg-secondary hover:bg-surface-hover',
                )}
              >
                <input type="radio" value={type} className="sr-only" {...register('accountType')} />
                <Icon className="size-4" aria-hidden />
                {AccountTypeLabel[type]}
              </label>
            )
          })}
        </fieldset>

        <InputField label="Seu nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
        {isCompany && <InputField label="Nome da empresa" error={errors.accountName?.message} {...register('accountName')} />}
        <InputField
          label={isCompany ? 'CNPJ (opcional)' : 'CPF (opcional)'}
          inputMode="numeric"
          error={errors.document?.message}
          {...register('document')}
        />
        <SelectField label="Ramo de atuação (opcional)" {...register('segment')}>
          <option value="">Prefiro não informar</option>
          {Object.values(AccountSegmentEnum).map((segment) => <option key={segment} value={segment}>{AccountSegmentLabel[segment]}</option>)}
        </SelectField>
        <InputField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <InputField label="Senha" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres" error={errors.password?.message} {...register('password')} />
        <Button type="submit" size="lg" loading={isSubmitting}>Criar conta</Button>
      </form>
      {showSwitchLink && (
        <p className="mt-6 text-center text-sm text-fg-secondary">
          Já tem conta? <Link href="/login" className="font-medium text-primary hover:text-primary-hover">Entrar</Link>
        </p>
      )}
    </div>
  )
}
