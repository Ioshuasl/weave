import { randomBytes } from 'node:crypto'
import { AppError, forbidden, notFound } from '../../../shared/errors/app-error'
import type { TenantContext } from '../../../shared/http/request-context'
import { can } from '../../../shared/security/permissions'
import { detectImageType, IMAGE_EXTENSIONS } from '../../../shared/security/image-type'
import type { PreviewStorage, TemplateRepository } from '../domain/ports'

export const MAX_PREVIEW_BYTES = 1024 * 1024

export class SetTemplatePreviewUseCase {
  constructor(
    private readonly templates: TemplateRepository,
    private readonly storage: PreviewStorage,
  ) {}

  /**
   * Miniatura gerada pelo navegador (1ª folha com os dados fictícios padrão).
   * Quem edita o modelo (ou o suporte, nos prontos) substitui quando quiser; qualquer membro pode
   * enviá-la APENAS se ainda não existir — é a geração sob demanda da galeria.
   */
  async execute(data: { tenant: TenantContext; templateId: string; content: Buffer }): Promise<{ previewUrl: string }> {
    if (!can(data.tenant.role, 'templates:read')) throw forbidden()
    const template = await this.templates.findVisible(data.tenant.accountId, data.templateId)
    if (!template) throw notFound('Modelo não encontrado')

    const canReplace = template.isSystem ? data.tenant.isSupport : can(data.tenant.role, 'templates:write')
    if (template.previewUrl && !canReplace) throw forbidden('A miniatura deste modelo já existe.')

    if (data.content.length === 0) throw new AppError('PREVIEW_EMPTY', 'Nenhuma imagem enviada.', 422)
    if (data.content.length > MAX_PREVIEW_BYTES) throw new AppError('PREVIEW_TOO_LARGE', 'A miniatura deve ter no máximo 1 MB.', 422)
    const type = detectImageType(data.content)
    if (!type) throw new AppError('PREVIEW_INVALID', 'Envie uma imagem JPEG, PNG ou WebP válida.', 422)

    // nome aleatório: a URL não é adivinhável e muda a cada gravação (evita cache antigo)
    const file = `${randomBytes(18).toString('base64url')}.${IMAGE_EXTENSIONS[type]}`
    await this.storage.save(file, data.content)
    const previous = await this.templates.setPreviewFile(data.templateId, file)
    if (previous) await this.storage.remove(previous)
    return { previewUrl: `/previews/${file}` }
  }
}
