'use client'

import Link from 'next/link'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { InputField } from '@/shared/ui/Field'
import { useLoginFormHook } from '../hooks/useAuthFormHook'
import { AuthHeading } from './AuthHeading'

/** Formulário de entrada (sem moldura): o palco `AuthStage` decide onde e como ele aparece. */
export const LoginFormBody = ({ showSwitchLink = true }: { showSwitchLink?: boolean }) => {
  const { form, errorMessage, handleSubmit } = useLoginFormHook()
  const { register, formState } = form
  const { errors, isSubmitting } = formState

  return (
    <div className="w-full">
      <AuthHeading title="Entrar" subtitle="Acesse sua conta para continuar." />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {errorMessage && <Alert>{errorMessage}</Alert>}
        <InputField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <InputField label="Senha" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" size="lg" loading={isSubmitting}>Entrar</Button>
      </form>
      {showSwitchLink && (
        <p className="mt-6 text-center text-sm text-fg-secondary">
          Ainda não tem conta? <Link href="/cadastro" className="font-medium text-primary hover:text-primary-hover">Criar conta</Link>
        </p>
      )}
    </div>
  )
}
