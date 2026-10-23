import type { Request, Response } from 'express'
import type {
  GetAssistantStatusUseCase,
  ListAssistantHistoryUseCase,
  SendAssistantRequestUseCase,
} from '../application/assistant.use-cases'
import { assistantRequestSchema } from './assistant.schemas'
import { z } from 'zod'

const params = z.object({ id: z.string().uuid() })

export class AssistantController {
  constructor(
    private readonly status: GetAssistantStatusUseCase,
    private readonly send: SendAssistantRequestUseCase,
    private readonly history: ListAssistantHistoryUseCase,
  ) {}

  getStatus = (_req: Request, res: Response) => {
    res.json(this.status.execute())
  }

  sendRequest = async (req: Request, res: Response) => {
    const { id } = params.parse(req.params)
    res.json(await this.send.execute({ tenant: req.tenant!, templateId: id, input: assistantRequestSchema.parse(req.body) }))
  }

  listHistory = async (req: Request, res: Response) => {
    const { id } = params.parse(req.params)
    res.json(await this.history.execute({ tenant: req.tenant!, templateId: id }))
  }
}
