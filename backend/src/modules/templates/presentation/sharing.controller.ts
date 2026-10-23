import type { Request, Response } from 'express'
import type { ApproveSubmissionUseCase, CancelSubmissionUseCase, GetSubmissionUseCase, ListSubmissionsUseCase, RejectSubmissionUseCase, SubmitToLibraryUseCase } from '../application/library.use-cases'
import type { CopySharedTemplateUseCase, GetSharedTemplateUseCase, GetSharingUseCase, UpdateSharingUseCase } from '../application/sharing.use-cases'
import {
  approveSubmissionSchema,
  rejectSubmissionSchema,
  shareSettingsSchema,
  submissionParamSchema,
  submissionQuerySchema,
  submitToLibrarySchema,
  templateParamSchema,
  tokenParamSchema,
} from './templates.schemas'

export class SharingController {
  constructor(
    private readonly getSharing: GetSharingUseCase,
    private readonly updateSharing: UpdateSharingUseCase,
    private readonly getShared: GetSharedTemplateUseCase,
    private readonly copyShared: CopySharedTemplateUseCase,
    private readonly submit: SubmitToLibraryUseCase,
    private readonly cancel: CancelSubmissionUseCase,
    private readonly listSubmissions: ListSubmissionsUseCase,
    private readonly getSubmission: GetSubmissionUseCase,
    private readonly approve: ApproveSubmissionUseCase,
    private readonly reject: RejectSubmissionUseCase,
  ) {}

  show = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.json(await this.getSharing.execute({ tenant: req.tenant!, templateId: id }))
  }

  update = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.json(await this.updateSharing.execute({ tenant: req.tenant!, templateId: id, ...shareSettingsSchema.parse(req.body) }))
  }

  showShared = async (req: Request, res: Response) => {
    const { token } = tokenParamSchema.parse(req.params)
    res.json(await this.getShared.execute({ token, userId: req.auth?.userId }))
  }

  copy = async (req: Request, res: Response) => {
    const { token } = tokenParamSchema.parse(req.params)
    res.status(201).json(await this.copyShared.execute({ tenant: req.tenant!, token }))
  }

  submitToLibrary = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.status(201).json(await this.submit.execute({ tenant: req.tenant!, templateId: id, ...submitToLibrarySchema.parse(req.body ?? {}) }))
  }

  cancelSubmission = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    await this.cancel.execute({ tenant: req.tenant!, templateId: id })
    res.status(204).end()
  }

  listForReview = async (req: Request, res: Response) => {
    res.json(await this.listSubmissions.execute({ tenant: req.tenant!, ...submissionQuerySchema.parse(req.query) }))
  }

  showSubmission = async (req: Request, res: Response) => {
    const { id } = submissionParamSchema.parse(req.params)
    res.json(await this.getSubmission.execute({ tenant: req.tenant!, id }))
  }

  approveSubmission = async (req: Request, res: Response) => {
    const { id } = submissionParamSchema.parse(req.params)
    res.status(201).json(await this.approve.execute({ tenant: req.tenant!, id, ...approveSubmissionSchema.parse(req.body ?? {}) }))
  }

  rejectSubmission = async (req: Request, res: Response) => {
    const { id } = submissionParamSchema.parse(req.params)
    await this.reject.execute({ tenant: req.tenant!, id, ...rejectSubmissionSchema.parse(req.body) })
    res.status(204).end()
  }
}
