import type { Request, Response } from 'express'
import type {
  CreateMockDatasetUseCase,
  DeleteMockDatasetUseCase,
  ListMockDatasetsUseCase,
  UpdateMockDatasetUseCase,
} from '../application/mock-datasets.use-cases'
import {
  createMockDatasetSchema,
  datasetParamSchema,
  templateParamSchema,
  updateMockDatasetSchema,
} from './templates.schemas'

export class MockDatasetsController {
  constructor(
    private readonly listDatasets: ListMockDatasetsUseCase,
    private readonly createDataset: CreateMockDatasetUseCase,
    private readonly updateDataset: UpdateMockDatasetUseCase,
    private readonly deleteDataset: DeleteMockDatasetUseCase,
  ) {}

  list = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.json(await this.listDatasets.execute({ tenant: req.tenant!, templateId: id }))
  }

  create = async (req: Request, res: Response) => {
    const { id } = templateParamSchema.parse(req.params)
    res.status(201).json(await this.createDataset.execute({ tenant: req.tenant!, templateId: id, ...createMockDatasetSchema.parse(req.body) }))
  }

  update = async (req: Request, res: Response) => {
    const { id, datasetId } = datasetParamSchema.parse(req.params)
    res.json(await this.updateDataset.execute({ tenant: req.tenant!, templateId: id, datasetId, ...updateMockDatasetSchema.parse(req.body) }))
  }

  remove = async (req: Request, res: Response) => {
    const { id, datasetId } = datasetParamSchema.parse(req.params)
    await this.deleteDataset.execute({ tenant: req.tenant!, templateId: id, datasetId })
    res.status(204).end()
  }
}
