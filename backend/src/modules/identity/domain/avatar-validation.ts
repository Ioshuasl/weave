import { AppError } from '../../../shared/errors/app-error'
import { detectImageType, IMAGE_EXTENSIONS } from '../../../shared/security/image-type'

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export const detectAvatarType = detectImageType

export const assertValidAvatar = (content: Buffer): { extension: string } => {
  if (content.length === 0) throw new AppError('AVATAR_EMPTY', 'Nenhuma imagem enviada.', 422)
  if (content.length > MAX_AVATAR_BYTES) throw new AppError('AVATAR_TOO_LARGE', 'A foto deve ter no máximo 2 MB.', 422)
  const type = detectImageType(content)
  if (!type) throw new AppError('AVATAR_INVALID', 'Envie uma imagem JPEG, PNG ou WebP válida.', 422)
  return { extension: IMAGE_EXTENSIONS[type] }
}
