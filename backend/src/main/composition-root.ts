import path from 'node:path'
import { DiskFileStorage } from '../shared/infra/disk-file-storage'
import { makeRequireSupport } from '../shared/http/require-support'
import { env } from '../shared/config/env'
import {
  AccountsController,
  GetAccountUseCase,
  makeTenantContext,
  PrismaAccountRepository,
  RegisterAccountUseCase,
  UpdateAccountUseCase,
} from '../modules/accounts'
import {
  ChangePasswordUseCase,
  DiskAvatarStorage,
  ListSessionsUseCase,
  RemoveAvatarUseCase,
  RevokeSessionUseCase,
  UpdateProfileUseCase,
  UploadAvatarUseCase,
  Argon2PasswordHasher,
  GetCurrentUserUseCase,
  IdentityController,
  JwtAccessTokenService,
  LoginUseCase,
  LogoutUseCase,
  makeAuthenticate,
  makeOptionalAuthenticate,
  PrismaSessionRepository,
  PrismaUserRepository,
  RefreshSessionUseCase,
  StartSessionUseCase,
} from '../modules/identity'
import {
  AcceptInvitationUseCase,
  ChangeMemberRoleUseCase,
  CreateManagedMemberUseCase,
  InviteMemberUseCase,
  PrismaManagedMemberRepository,
  ResetMemberPasswordUseCase,
  ListMembersUseCase,
  LogMailSender,
  MembersController,
  PreviewInvitationUseCase,
  PrismaInvitationRepository,
  PrismaMemberRepository,
  PrismaUserDirectory,
  RemoveMemberUseCase,
  RevokeInvitationUseCase,
} from '../modules/members'

import {
  CreateLessonUseCase,
  CreateTrackUseCase,
  DeleteLessonUseCase,
  DeleteTrackUseCase,
  GetLessonUseCase,
  ListAllTrainingUseCase,
  ListTrainingUseCase,
  PrismaTrainingRepository,
  SetLessonCompletedUseCase,
  TrainingController,
  UpdateLessonUseCase,
  UpdateTrackUseCase,
} from '../modules/training'
import {
  CreateTagUseCase,
  DeleteTagUseCase,
  ListTagsUseCase,
  PrismaTagAccess,
  PrismaTagRepository,
  TagsController,
  UpdateTagUseCase,
} from '../modules/tags'
import {
  AssistantController,
  GetAssistantStatusUseCase,
  ListAssistantHistoryUseCase,
  N8nAssistantGateway,
  PrismaAssistantHistoryRepository,
  SendAssistantRequestUseCase,
} from '../modules/assistant'
import {
  ApproveSubmissionUseCase,
  ArchiveTemplateUseCase,
  CancelSubmissionUseCase,
  CopySharedTemplateUseCase,
  GetSharedTemplateUseCase,
  GetSharingUseCase,
  GetSubmissionUseCase,
  ListSubmissionsUseCase,
  PrismaLibrarySubmissionRepository,
  PrismaSharingRepository,
  RejectSubmissionUseCase,
  SharingController,
  SubmitToLibraryUseCase,
  UpdateSharingUseCase,
  CreateMockDatasetUseCase,
  CreateSystemTemplateUseCase,
  CreateTemplateUseCase,
  DeleteMockDatasetUseCase,
  PublishTemplateAsSystemUseCase,
  SetTemplatePreviewUseCase,
  DiffVersionUseCase,
  ListMockDatasetsUseCase,
  MockDatasetsController,
  PrismaMockDatasetRepository,
  UpdateMockDatasetUseCase,
  DuplicateTemplateUseCase,
  GetTemplateUseCase,
  ListTemplatesUseCase,
  ListVersionsUseCase,
  PrismaTemplateRepository,
  RestoreVersionUseCase,
  TemplatesController,
  UpdateTemplateUseCase,
} from '../modules/templates'

export const buildContainer = () => {
  const hasher = new Argon2PasswordHasher()
  const accessTokens = new JwtAccessTokenService(env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL_MINUTES)
  const sessions = new PrismaSessionRepository()
  const users = new PrismaUserRepository()
  const accounts = new PrismaAccountRepository()
  const memberRepo = new PrismaMemberRepository()
  const invitationRepo = new PrismaInvitationRepository()
  const userDirectory = new PrismaUserDirectory()
  const managedRepo = new PrismaManagedMemberRepository()
  const templateRepo = new PrismaTemplateRepository()
  const datasetRepo = new PrismaMockDatasetRepository()
  const sharingRepo = new PrismaSharingRepository()
  const submissionRepo = new PrismaLibrarySubmissionRepository()
  const assistantGateway = new N8nAssistantGateway({
    url: env.N8N_ASSISTANT_URL,
    user: env.N8N_BASIC_USER,
    password: env.N8N_BASIC_PASSWORD,
    timeoutSeconds: env.N8N_ASSISTANT_TIMEOUT_SECONDS,
  })
  const assistantHistory = new PrismaAssistantHistoryRepository()
  const trainingRepo = new PrismaTrainingRepository()
  const tagRepo = new PrismaTagRepository()
  const tagAccess = new PrismaTagAccess()

  const avatarStorage = new DiskAvatarStorage(path.resolve(env.STORAGE_DIR, 'avatars'))
  const previewStorage = new DiskFileStorage(path.resolve(env.STORAGE_DIR, 'previews'))
  const startSession = new StartSessionUseCase(sessions, accessTokens, env.REFRESH_TOKEN_TTL_DAYS, users)

  return {
    avatarDir: avatarStorage.dir,
    previewDir: previewStorage.dir,
    authenticate: makeAuthenticate(accessTokens),
    authenticateAllowRestricted: makeAuthenticate(accessTokens, true),
    optionalAuthenticate: makeOptionalAuthenticate(accessTokens),
    tenant: makeTenantContext(accounts),
    requireSupport: makeRequireSupport((userId) => accounts.isSupport(userId)),
    identity: new IdentityController(
      new LoginUseCase(users, hasher, startSession),
      new RefreshSessionUseCase(sessions, startSession),
      new LogoutUseCase(sessions),
      new GetCurrentUserUseCase(users),
      new UpdateProfileUseCase(users),
      new UploadAvatarUseCase(users, avatarStorage),
      new RemoveAvatarUseCase(users, avatarStorage),
      new ChangePasswordUseCase(users, sessions, hasher, startSession),
      new ListSessionsUseCase(sessions),
      new RevokeSessionUseCase(sessions),
    ),
    accounts: new AccountsController(
      new RegisterAccountUseCase(accounts, hasher, startSession),
      new GetAccountUseCase(accounts),
      new UpdateAccountUseCase(accounts),
    ),
    sharing: new SharingController(
      new GetSharingUseCase(templateRepo, sharingRepo, submissionRepo),
      new UpdateSharingUseCase(templateRepo, sharingRepo),
      new GetSharedTemplateUseCase(sharingRepo),
      new CopySharedTemplateUseCase(templateRepo, sharingRepo, datasetRepo),
      new SubmitToLibraryUseCase(templateRepo, datasetRepo, submissionRepo),
      new CancelSubmissionUseCase(templateRepo, submissionRepo),
      new ListSubmissionsUseCase(submissionRepo),
      new GetSubmissionUseCase(submissionRepo),
      new ApproveSubmissionUseCase(submissionRepo, templateRepo, datasetRepo, tagAccess),
      new RejectSubmissionUseCase(submissionRepo),
    ),
    templates: new TemplatesController(
      new ListTemplatesUseCase(templateRepo),
      new GetTemplateUseCase(templateRepo),
      new CreateTemplateUseCase(templateRepo, tagAccess),
      new DuplicateTemplateUseCase(templateRepo, datasetRepo),
      new UpdateTemplateUseCase(templateRepo, tagAccess),
      new ArchiveTemplateUseCase(templateRepo),
      new ListVersionsUseCase(templateRepo),
      new RestoreVersionUseCase(templateRepo),
      new DiffVersionUseCase(templateRepo),
      new CreateSystemTemplateUseCase(templateRepo, tagAccess),
      new PublishTemplateAsSystemUseCase(templateRepo, datasetRepo),
      new SetTemplatePreviewUseCase(templateRepo, previewStorage),
    ),
    assistant: new AssistantController(
      new GetAssistantStatusUseCase(assistantGateway),
      new SendAssistantRequestUseCase(assistantGateway, assistantHistory, templateRepo),
      new ListAssistantHistoryUseCase(assistantHistory, templateRepo),
    ),
    training: new TrainingController(
      new ListTrainingUseCase(trainingRepo),
      new GetLessonUseCase(trainingRepo),
      new SetLessonCompletedUseCase(trainingRepo),
      new ListAllTrainingUseCase(trainingRepo),
      new CreateTrackUseCase(trainingRepo),
      new UpdateTrackUseCase(trainingRepo),
      new DeleteTrackUseCase(trainingRepo),
      new CreateLessonUseCase(trainingRepo),
      new UpdateLessonUseCase(trainingRepo),
      new DeleteLessonUseCase(trainingRepo),
    ),
    tags: new TagsController(
      new ListTagsUseCase(tagRepo),
      new CreateTagUseCase(tagRepo),
      new UpdateTagUseCase(tagRepo),
      new DeleteTagUseCase(tagRepo),
    ),
    mockDatasets: new MockDatasetsController(
      new ListMockDatasetsUseCase(templateRepo, datasetRepo),
      new CreateMockDatasetUseCase(templateRepo, datasetRepo),
      new UpdateMockDatasetUseCase(templateRepo, datasetRepo),
      new DeleteMockDatasetUseCase(templateRepo, datasetRepo),
    ),
    members: new MembersController(
      new ListMembersUseCase(memberRepo, invitationRepo),
      new InviteMemberUseCase(memberRepo, invitationRepo, new LogMailSender(), env.FRONTEND_URL),
      new ChangeMemberRoleUseCase(memberRepo),
      new RemoveMemberUseCase(memberRepo),
      new RevokeInvitationUseCase(invitationRepo),
      new PreviewInvitationUseCase(invitationRepo, userDirectory),
      new AcceptInvitationUseCase(invitationRepo, memberRepo, userDirectory, hasher, startSession),
      new CreateManagedMemberUseCase(memberRepo, managedRepo, hasher),
      new ResetMemberPasswordUseCase(memberRepo, managedRepo, hasher),
    ),
  }
}
