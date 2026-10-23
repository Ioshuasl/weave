import type { Request, Response } from 'express'
import type {
  CreateLessonUseCase,
  CreateTrackUseCase,
  DeleteLessonUseCase,
  DeleteTrackUseCase,
  GetLessonUseCase,
  ListAllTrainingUseCase,
  ListTrainingUseCase,
  SetLessonCompletedUseCase,
  UpdateLessonUseCase,
  UpdateTrackUseCase,
} from '../application/training.use-cases'
import { idParam, lessonSchema, lessonUpdateSchema, trackSchema, trackUpdateSchema } from './training.schemas'

export class TrainingController {
  constructor(
    private readonly list: ListTrainingUseCase,
    private readonly getLesson: GetLessonUseCase,
    private readonly setCompleted: SetLessonCompletedUseCase,
    private readonly listAll: ListAllTrainingUseCase,
    private readonly createTrack: CreateTrackUseCase,
    private readonly updateTrack: UpdateTrackUseCase,
    private readonly deleteTrack: DeleteTrackUseCase,
    private readonly createLesson: CreateLessonUseCase,
    private readonly updateLesson: UpdateLessonUseCase,
    private readonly deleteLesson: DeleteLessonUseCase,
  ) {}

  // ---- usuário ----
  index = async (req: Request, res: Response) => {
    res.json(await this.list.execute({ userId: req.auth!.userId }))
  }

  lesson = async (req: Request, res: Response) => {
    const { id } = idParam.parse(req.params)
    res.json(await this.getLesson.execute({ userId: req.auth!.userId, lessonId: id }))
  }

  complete = (completed: boolean) => async (req: Request, res: Response) => {
    const { id } = idParam.parse(req.params)
    await this.setCompleted.execute({ userId: req.auth!.userId, lessonId: id, completed })
    res.status(204).end()
  }

  // ---- suporte ----
  adminIndex = async (_req: Request, res: Response) => {
    res.json(await this.listAll.execute())
  }

  adminCreateTrack = async (req: Request, res: Response) => {
    res.status(201).json(await this.createTrack.execute(trackSchema.parse(req.body)))
  }

  adminUpdateTrack = async (req: Request, res: Response) => {
    const { id } = idParam.parse(req.params)
    res.json(await this.updateTrack.execute({ trackId: id, ...trackUpdateSchema.parse(req.body) }))
  }

  adminDeleteTrack = async (req: Request, res: Response) => {
    const { id } = idParam.parse(req.params)
    await this.deleteTrack.execute({ trackId: id })
    res.status(204).end()
  }

  adminCreateLesson = async (req: Request, res: Response) => {
    const { id } = idParam.parse(req.params)
    res.status(201).json(await this.createLesson.execute({ trackId: id, ...lessonSchema.parse(req.body) }))
  }

  adminUpdateLesson = async (req: Request, res: Response) => {
    const { id } = idParam.parse(req.params)
    res.json(await this.updateLesson.execute({ lessonId: id, ...lessonUpdateSchema.parse(req.body) }))
  }

  adminDeleteLesson = async (req: Request, res: Response) => {
    const { id } = idParam.parse(req.params)
    await this.deleteLesson.execute({ lessonId: id })
    res.status(204).end()
  }
}
