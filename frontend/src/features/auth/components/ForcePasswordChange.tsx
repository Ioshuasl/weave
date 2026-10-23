'use client'

import { MotionConfig } from 'framer-motion'
import { LogOut, ShieldCheck } from 'lucide-react'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { InputField } from '@/shared/ui/Field'
import { WeaveLogo } from '@/shared/ui/WeaveLogo'
import { useForcePasswordHook } from '../hooks/useForcePasswordHook'
import { useAuth } from './AuthProvider'
import { AuthBackdrop } from './stage/AuthBackdrop'

/** Primeiro acesso com senha provisória: nada do app aparece até a pessoa definir a senha definitiva. */
export const ForcePasswordChange = () => {
  const { user, executeSignOut } = useAuth()
  const { form, errorMessage, handleSubmit } = useForcePasswordHook()
  const { register, formState } = form
  const { errors, isSubmitting } = formState

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-dvh overflow-hidden bg-background">
        <AuthBackdrop />
        <div className="pointer-events-none relative z-10 flex min-h-dvh items-center justify-center p-4">
          <div data-auth-panel className="pointer-events-auto w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8">
            <WeaveLogo className="mb-6" />
            <div className="mb-1 flex items-center gap-2 text-primary"><ShieldCheck className="size-5" aria-hidden /><span className="text-sm font-medium">Primeiro acesso</span></div>
            <h1 className="text-2xl font-semibold text-foreground">Defina sua senha</h1>
            <p className="mt-1 text-base text-fg-secondary">
              {user ? `Olá, ${user.name.split(' ')[0]}! ` : ''}Por segurança, troque a senha provisória por uma senha só sua para continuar.
            </p>
            <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
              {errorMessage && <Alert>{errorMessage}</Alert>}
              <InputField label="Senha provisória" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
              <InputField label="Nova senha" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres" error={errors.newPassword?.message} {...register('newPassword')} />
              <InputField label="Confirmar nova senha" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              <Button type="submit" size="lg" loading={isSubmitting}>Definir senha e entrar</Button>
            </form>
            <button type="button" onClick={executeSignOut} className="mx-auto mt-5 flex items-center gap-1.5 text-sm text-fg-secondary hover:text-foreground">
              <LogOut className="size-4" aria-hidden />Sair
            </button>
          </div>
        </div>
      </main>
    </MotionConfig>
  )
}
