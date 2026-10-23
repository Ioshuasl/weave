import type { Request, Response } from 'express'
import type { CreateTagUseCase, DeleteTagUseCase, ListTagsUseCase, UpdateTagUseCase } from '../application/tags.use-cases'
import { createTagSchema, tagParamSchema, updateTagSchema } from './tags.schemas'

export class TagsController {
  constructor(
    private readonly listTags: ListTagsUseCase,
    private readonly createTag: CreateTagUseCase,
    private readonly updateTag: UpdateTagUseCase,
    private readonly deleteTag: DeleteTagUseCase,
  ) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.listTags.execute({ tenant: req.tenant! }))
  }

  create = async (req: Request, res: Response) => {
    res.status(201).json(await this.createTag.execute({ tenant: req.tenant!, ...createTagSchema.parse(req.body) }))
  }

  update = async (req: Request, res: Response) => {
    const { id } = tagParamSchema.parse(req.params)
    res.json(await this.updateTag.execute({ tenant: req.tenant!, tagId: id, ...updateTagSchema.parse(req.body) }))
  }

  remove = async (req: Request, res: Response) => {
    const { id } = tagParamSchema.parse(req.params)
    await this.deleteTag.execute({ tenant: req.tenant!, tagId: id })
    res.status(204).end()
  }
}
