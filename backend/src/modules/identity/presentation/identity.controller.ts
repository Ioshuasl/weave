import type { Request, Response } from 'express'
import type { GetCurrentUserUseCase } from '../application/get-current-user.use-case'
import type { LoginUseCase } from '../application/login.use-case'
import type { LogoutUseCase } from '../application/logout.use-case'
import type { RefreshSessionUseCase } from '../application/refresh-session.use-case'
import type {
  ChangePasswordUseCase,
  ListSessionsUseCase,
  RemoveAvatarUseCase,
  RevokeSessionUseCase,
  UpdateProfileUseCase,
  UploadAvatarUseCase,
} from '../application/profile.use-cases'
import { unauthorized } from '../../../shared/errors/app-error'
import { changePasswordSchema, loginSchema, sessionParamSchema, updateProfileSchema } from './identity.schemas'
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from './session-cookie'

export class IdentityController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly uploadAvatar: UploadAvatarUseCase,
    private readonly removeAvatar: RemoveAvatarUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly listSessions: ListSessionsUseCase,
    private readonly revokeSession: RevokeSessionUseCase,
  ) {}

  signIn = async (req: Request, res: Response) => {
    const body = loginSchema.parse(req.body)
    const tokens = await this.login.execute({ ...body, userAgent: req.get('user-agent'), ip: req.ip })
    setRefreshCookie(res, tokens)
    res.json({ accessToken: tokens.accessToken, mustChangePassword: tokens.mustChangePassword })
  }

  refreshSession = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined
    if (!refreshToken) throw unauthorized()
    const tokens = await this.refresh.execute({ refreshToken, userAgent: req.get('user-agent'), ip: req.ip })
    setRefreshCookie(res, tokens)
    res.json({ accessToken: tokens.accessToken, mustChangePassword: tokens.mustChangePassword })
  }

  signOut = async (req: Request, res: Response) => {
    await this.logoutUseCase.execute({ refreshToken: req.cookies?.[REFRESH_COOKIE] as string | undefined })
    clearRefreshCookie(res)
    res.status(204).end()
  }

  me = async (req: Request, res: Response) => {
    const { avatarFile, ...profile } = await this.getCurrentUser.execute({ userId: req.auth!.userId })
    res.json({ ...profile, avatarUrl: avatarFile ? `/avatars/${avatarFile}` : null })
  }

  patchMe = async (req: Request, res: Response) => {
    await this.updateProfile.execute({ userId: req.auth!.userId, ...updateProfileSchema.parse(req.body) })
    await this.me(req, res)
  }

  putAvatar = async (req: Request, res: Response) => {
    const content = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0)
    await this.uploadAvatar.execute({ userId: req.auth!.userId, content })
    await this.me(req, res)
  }

  deleteAvatar = async (req: Request, res: Response) => {
    await this.removeAvatar.execute({ userId: req.auth!.userId })
    res.status(204).end()
  }

  postPassword = async (req: Request, res: Response) => {
    const tokens = await this.changePassword.execute({
      userId: req.auth!.userId,
      ...changePasswordSchema.parse(req.body),
      userAgent: req.get('user-agent'),
      ip: req.ip,
    })
    setRefreshCookie(res, tokens)
    res.json({ accessToken: tokens.accessToken })
  }

  getSessions = async (req: Request, res: Response) => {
    res.json(await this.listSessions.execute({ userId: req.auth!.userId, currentRefreshToken: req.cookies?.[REFRESH_COOKIE] as string | undefined }))
  }

  deleteSession = async (req: Request, res: Response) => {
    const { id } = sessionParamSchema.parse(req.params)
    await this.revokeSession.execute({ userId: req.auth!.userId, sessionId: id })
    res.status(204).end()
  }
}
