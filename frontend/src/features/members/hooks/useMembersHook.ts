'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api'
import { membersService } from '../services/members.service'
import type { InviteFormValues } from '../schemas/members.schemas'
import type { MembersOverview } from '../types'

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : 'Ocorreu um erro. Tente novamente.')

export const useMembersHook = () => {
  const [data, setData] = useState<MembersOverview>({ members: [], invitations: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const executeLoad = useCallback(async () => {
    try {
      setData(await membersService.list())
      setErrorMessage(null)
    } catch (err) {
      setErrorMessage(messageOf(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleAction = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action()
        await executeLoad()
        return true
      } catch (err) {
        setErrorMessage(messageOf(err))
        return false
      }
    },
    [executeLoad],
  )

  const handleInvite = (values: InviteFormValues) => handleAction(() => membersService.invite(values))
  const handleChangeRole = (id: string, role: InviteFormValues['role']) =>
    handleAction(() => membersService.changeRole(id, role))
  const handleRemove = (id: string) => handleAction(() => membersService.remove(id))
  const handleRevoke = (id: string) => handleAction(() => membersService.revokeInvitation(id))

  return { ...data, isLoading, errorMessage, executeLoad, handleInvite, handleChangeRole, handleRemove, handleRevoke }
}
