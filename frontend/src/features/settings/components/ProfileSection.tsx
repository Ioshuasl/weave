'use client'

import { Upload, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { formatTimezone, listTimezones } from '@/shared/actions/formatTimezone'
import { Alert } from '@/shared/ui/Alert'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { InputField, SelectField, TextareaField } from '@/shared/ui/Field'
import { useProfileFormHook } from '../hooks/useProfileFormHook'
import { AffixField } from './AffixField'
import { SettingsGroup } from './SettingsGroup'

const BANNER_KEY = 'weave.profileBannerDismissed'

const readDismissed = () => {
  try {
    return window.localStorage.getItem(BANNER_KEY) === '1'
  } catch {
    return false
  }
}

export const ProfileSection = () => {
  const { user } = useAuth()
  const p = useProfileFormHook()
  const [bannerDismissed, setBannerDismissed] = useState(readDismissed)
  const { register, watch, formState } = p.form
  const { errors, isSubmitting, isDirty } = formState
  const timezones = listTimezones()
  const needsProfile = !user?.avatarUrl || !user?.jobRole

  const handleDismissBanner = () => {
    setBannerDismissed(true)
    try {
      window.localStorage.setItem(BANNER_KEY, '1')
    } catch {
      /* sem armazenamento: some só nesta sessão */
    }
  }

  return (
    <form onSubmit={p.handleSubmit} noValidate className="overflow-hidden rounded-xl border border-border bg-surface">
      {needsProfile && !bannerDismissed && (
        <div className="flex flex-wrap items-center gap-3 border-b border-warning/30 bg-warning-subtle px-5 py-2.5">
          <UserRound className="size-4 shrink-0 text-warning" aria-hidden />
          <p className="min-w-0 flex-1 text-sm"><strong className="font-medium">Complete seu perfil:</strong> <span className="text-fg-secondary">adicione uma foto e o seu cargo.</span></p>
          <Button type="button" variant="ghost" size="sm" onClick={handleDismissBanner}>Dispensar</Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-5">
        <Avatar avatarUrl={user?.avatarUrl} className="size-16" iconClassName="size-7" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-md font-semibold">{user?.name}</p>
          <p className="truncate text-sm text-fg-muted">{user?.email}</p>
        </div>
        <input ref={p.fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Escolher foto de perfil" onChange={(e) => p.handlePhotoSelected(e.target.files?.[0])} />
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" loading={p.isUploading} onClick={p.handlePickPhoto}><Upload className="size-4" aria-hidden />{user?.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}</Button>
          {user?.avatarUrl && <Button type="button" variant="ghost" size="sm" onClick={p.handleRemovePhoto}><X className="size-4" aria-hidden />Remover</Button>}
        </div>
      </div>

      {p.message && <div className="border-b border-border px-5 py-3"><Alert tone={p.message.tone}>{p.message.text}</Alert></div>}

      <SettingsGroup title="Dados pessoais" description="Como você aparece para a sua equipe.">
        <InputField label="Nome completo" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <AffixField label="Nome de usuário" prefix="@" autoCapitalize="none" error={errors.username?.message} {...register('username')} />
        <InputField label="E-mail" value={user?.email ?? ''} hint="E-mail de acesso; não pode ser alterado aqui." readOnly disabled />
        <InputField label="Cargo" placeholder="Ex.: Tabelião substituto" error={errors.jobRole?.message} {...register('jobRole')} />
      </SettingsGroup>

      <SettingsGroup title="Preferências e presença" description="Fuso horário, site e uma breve apresentação.">
        <SelectField label="Fuso horário" {...register('timezone')}>
          {timezones.map((tz) => <option key={tz} value={tz}>{formatTimezone(tz)}</option>)}
        </SelectField>
        <AffixField label="Site" prefix="https://" placeholder="meusite.com.br" error={errors.website?.message} {...register('website')} />
        <div className="sm:col-span-2">
          <TextareaField label="Bio" rows={3} maxLength={300} hint={`${watch('bio')?.length ?? 0}/300 caracteres`} error={errors.bio?.message} {...register('bio')} />
        </div>
      </SettingsGroup>

      <footer className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-surface-secondary px-5 py-3">
        <p className="text-xs text-fg-muted" aria-live="polite">{isDirty ? 'Você tem alterações não salvas.' : ''}</p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={!isDirty} onClick={p.handleCancel}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Salvar alterações</Button>
        </div>
      </footer>
    </form>
  )
}
