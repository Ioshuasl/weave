'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AuthHeading } from '@/features/auth/components/AuthHeading'
import { MemberRoleLabel } from '@/shared/enums/MemberRoleEnum'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { InputField } from '@/shared/ui/Field'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useAcceptInvitationHook } from '../hooks/useAcceptInvitationHook'

export const AcceptInvitation = ({ token }: { token: string }) => {
  const { form, preview, isLoading, errorMessage, isAuthenticated, executeLoadPreview, handleAccept, handleSubmit } =
    useAcceptInvitationHook(token)
  const { register, formState } = form

  useEffect(() => {
    executeLoadPreview()
  }, [executeLoadPreview])

  return (
    <div className="w-full">
      <AuthHeading title="Convite para a equipe" subtitle={preview ? `${preview.accountName} convidou você como ${MemberRoleLabel[preview.role]}.` : undefined} />
      {isLoading && (
        <div className="space-y-3"><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /><Skeleton className="h-10 w-full" /></div>
      )}
      {errorMessage && <Alert>{errorMessage}</Alert>}
      {preview && !preview.userExists && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <InputField label="E-mail" value={preview.email} disabled readOnly />
          <InputField label="Seu nome" error={formState.errors.name?.message} {...register('name')} />
          <InputField label="Crie uma senha" type="password" autoComplete="new-password" error={formState.errors.password?.message} {...register('password')} />
          <Button type="submit" size="lg" loading={formState.isSubmitting}>Aceitar convite</Button>
        </form>
      )}
      {preview?.userExists && (
        isAuthenticated ? (
          <Button size="lg" className="w-full" onClick={() => handleAccept({})}>Aceitar convite</Button>
        ) : (
          <p className="text-base text-fg-secondary">
            Já existe uma conta para {preview.email}. <Link href="/login" className="font-medium text-primary hover:text-primary-hover">Entre</Link> e abra este link novamente.
          </p>
        )
      )}
    </div>
  )
}
