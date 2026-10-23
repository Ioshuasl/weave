import { z } from 'zod'
import type { SetTemplatePreviewUseCase } from '../application/preview.use-cases'
import type { Request, Response } from 'express'
import type {
  ArchiveTemplateUseCase,
  CreateTemplateUseCase,
  DiffVersionUseCase,
  DuplicateTemplateUseCase,
  GetTemplateUseCase,
  ListTemplatesUseCase,
  ListVersionsUseCase,
  RestoreVersionUseCase,
  UpdateTemplateUseCase,
} from '../application/templates.use-cases'
import type { CreateSystemTemplateUseCase, PublishTemplateAsSystemUseCase } from '../application/support-templates.use-cases'
import {
  createSystemTemplateSchema,
  createTemplateSchema,
  publishTemplateSchema,
  duplicateTemplateSchema,
  listQuerySchema,
  templateParamSchema,
  updateTemplateSchema,
  versionParamSchema,
} from './templates.schemas'

export class TemplatesController {
  constructor(
    private readonly listTemplates: ListTemplatesUseCase,
    private readonly getTemplate: GetTemplateUseCase,
    private readonly createTemplate: CreateTemplateUseCase,
    private readonly duplicateTemplate: DuplicateTemplateUseCase,
    private readonly updateTemplate: UpdateTemplateUseCase,
    private readonly archiveTemplate: ArchiveTemplateUseCase,
    private readonly listVersions: ListVersionsUseCase,
    private readonly restoreVersion: RestoreVersionUseCase,
    private readonly diffVersion: DiffVersionUseCase,
    private readonly createSystem: CreateSystemTemplateUseCase,
    private readonly publishSystem: PublishTemplateAsSystemUseCase,
    private readonly setPreview: SetTemplatePreviewUseCase,
  ) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.listTemplates.execute({ tenant: req.tenant!, filters: listQuerySchema.parse(req.query) }))
  }

  show = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.json(await this.getTemplate.execute({ tenant: req.tenant!, templateId: id }))
  }

  create = async (req: Request, res: Response) => {
    res.status(201).json(await this.createTemplate.execute({ tenant: req.tenant!, ...createTemplateSchema.parse(req.body) }))
  }

  duplicate = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    const body = duplicateTemplateSchema.parse(req.body ?? {})
    res.status(201).json(await this.duplicateTemplate.execute({ tenant: req.tenant!, templateId: id, ...body }))
  }

  update = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.json(await this.updateTemplate.execute({ tenant: req.tenant!, templateId: id, ...updateTemplateSchema.parse(req.body) }))
  }

  archive = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    await this.archiveTemplate.execute({ tenant: req.tenant!, templateId: id })
    res.status(204).end()
  }

  versions = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.json(await this.listVersions.execute({ tenant: req.tenant!, templateId: id }))
  }

  createSystemTemplate = async (req: Request, res: Response) => {
    res.status(201).json(await this.createSystem.execute({ tenant: req.tenant!, ...createSystemTemplateSchema.parse(req.body) }))
  }

  publishAsSystem = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.status(201).json(await this.publishSystem.execute({ tenant: req.tenant!, templateId: id, ...publishTemplateSchema.parse(req.body ?? {}) }))
  }

  putPreview = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    const content = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0)
    res.json(await this.setPreview.execute({ tenant: req.tenant!, templateId: id, content }))
  }

  diff = async (req: Request, res: Response) => {
    const { id, number } = versionParamSchema.parse(req.params)
    const { against } = z.object({ against: z.coerce.number().int().positive().optional() }).parse(req.query)
    res.json(await this.diffVersion.execute({ tenant: req.tenant!, templateId: id, number, against }))
  }

  restore = async (req: Request, res: Response) => {
    const { id, number } = versionParamSchema.parse(req.params)
    res.json(await this.restoreVersion.execute({ tenant: req.tenant!, templateId: id, number }))
  }
}
