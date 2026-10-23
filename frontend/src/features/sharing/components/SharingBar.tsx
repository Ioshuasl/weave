'use client'

import { Globe, Library, Link2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AccountSegmentEnum } from '@/shared/enums/AccountSegmentEnum'
import { ShareModeEnum } from '@/shared/enums/ShareModeEnum'
import { SubmissionStatusLabel, SubmissionStatusTone } from '@/shared/enums/SubmissionStatusEnum'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useSharingHook } from '../hooks/useSharingHook'
import { LibrarySubmitDialog } from './LibrarySubmitDialog'
import { ShareDialog } from './ShareDialog'

interface Props {
  templateId: string
  templateDescription: string | null
  segment: AccountSegmentEnum | null
}

/** Botões "Compartilhar" e "Enviar para a Biblioteca" do detalhe do modelo, com o estado atual de cada um. */
export const SharingBar = ({ templateId, templateDescription, segment }: Props) => {
  const s = useSharingHook(templateId)
  const [dialog, setDialog] = useState<'share' | 'library' | null>(null)

  useEffect(() => {
    s.executeLoad()
  }, [s.executeLoad])

  if (s.isLoading) return <div className="flex gap-2"><Skeleton className="h-9 w-36" /><Skeleton className="h-9 w-52" /></div>
  if (!s.state) return null
  const { share, submission } = s.state
  const ShareIcon = share.mode === ShareModeEnum.PUBLIC ? Globe : share.mode === ShareModeEnum.MEMBERS ? Users : Link2

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setDialog('share')}>
          <ShareIcon className="size-4" aria-hidden />Compartilhar
          {share.mode !== ShareModeEnum.OFF && <Badge tone="success" className="ml-1">{share.mode === ShareModeEnum.PUBLIC ? 'Link público' : 'Só com conta'}</Badge>}
        </Button>
        <Button variant="secondary" onClick={() => setDialog('library')}>
          <Library className="size-4" aria-hidden />Enviar para a Biblioteca
          {submission && <Badge tone={SubmissionStatusTone[submission.status]} className="ml-1">{SubmissionStatusLabel[submission.status]}</Badge>}
        </Button>
      </div>
      {dialog === 'share' && <ShareDialog share={share} errorMessage={s.errorMessage} onSave={s.handleSaveShare} onClose={() => setDialog(null)} />}
      {dialog === 'library' && (
        <LibrarySubmitDialog
          templateDescription={templateDescription}
          defaultSegment={segment}
          submission={submission}
          errorMessage={s.errorMessage}
          onSubmit={s.handleSubmit}
          onCancelPending={s.handleCancel}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
