'use client'

import { useState } from 'react'
import { ApiError } from '@/shared/lib/api'
import type { CreateMemberFormValues } from '../schemas/members.schemas'
import { membersService } from '../services/members.service'
import type { Member } from '../types'

/** Cadastro de funcionário com senha provisória e redefinição de senha. Devolve o erro de API em texto (ou null). */
export const useManagedMembersHook = (onChanged: () => Promise<void>) => {
  const [lastCreated, setLastCreated] = useState<Member | null>(null)

  const handleCreate = async (values: CreateMemberFormValues): Promise<string | null> => {
    try {
      setLastCreated(await membersService.createWithPassword(values))
      await onChanged()
      return null
    } catch (err) {
      return err instanceof ApiError ? err.message : 'Não foi possível cadastrar o funcionário.'
    }
  }

  const handleReset = async (membershipId: string, temporaryPassword: string): Promise<string | null> => {
    try {
      await membersService.resetPassword(membershipId, temporaryPassword)
      await onChanged()
      return null
    } catch (err) {
      return err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha.'
    }
  }

  return { lastCreated, handleCreate, handleReset }
}
