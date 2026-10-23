import { AppError } from '../../../shared/errors/app-error'
import type { AssistantImage } from './ports'

const MAX_TOTAL_CHARS = 5_000_000

const signatures: Record<AssistantImage['tipo'], (head: Buffer) => boolean> = {
  'image/jpeg': (h) => h.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  'image/png': (h) => h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (h) => h.subarray(0, 4).toString('latin1') === 'RIFF' && h.subarray(8, 12).toString('latin1') === 'WEBP',
}

/** Confere o conteúdo real do base64 (formato e cabeçalho do arquivo), não só o tipo informado. */
export const assertValidImages = (images: AssistantImage[]) => {
  if (images.reduce((sum, i) => sum + i.base64.length, 0) > MAX_TOTAL_CHARS) {
    throw new AppError('IMAGES_TOO_LARGE', 'As imagens somam mais do que o permitido. Envie menos imagens ou reduza o tamanho.', 422)
  }
  images.forEach((image, index) => {
    const n = index + 1
    if (image.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.base64)) {
      throw new AppError('IMAGE_INVALID', `A imagem ${n} está corrompida (conteúdo inválido).`, 422)
    }
    const head = Buffer.from(image.base64.slice(0, 64), 'base64')
    if (!signatures[image.tipo](head)) {
      throw new AppError('IMAGE_INVALID', `A imagem ${n} não é um arquivo ${image.tipo.split('/')[1]!.toUpperCase()} válido.`, 422)
    }
  })
}
