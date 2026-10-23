import { DiskFileStorage } from '../../../shared/infra/disk-file-storage'
import type { AvatarStorage } from '../domain/ports'

/** Fotos de perfil em disco (`storage/avatars`). */
export class DiskAvatarStorage extends DiskFileStorage implements AvatarStorage {}
