export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message)
  }
}

export const notFound = (message = 'Recurso não encontrado') => new AppError('NOT_FOUND', message, 404)
export const unauthorized = (message = 'Não autenticado') => new AppError('UNAUTHORIZED', message, 401)
export const forbidden = (message = 'Sem permissão para esta ação') => new AppError('FORBIDDEN', message, 403)
export const conflict = (message: string) => new AppError('CONFLICT', message, 409)
