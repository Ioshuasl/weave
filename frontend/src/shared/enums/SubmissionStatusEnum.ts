export type SubmissionStatusEnum = 'PENDING' | 'APPROVED' | 'REJECTED'

export const SubmissionStatusLabel: Record<SubmissionStatusEnum, string> = {
  PENDING: 'Aguardando revisão',
  APPROVED: 'Publicado',
  REJECTED: 'Recusado',
}

export const SubmissionStatusTone = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'neutral' } as const
