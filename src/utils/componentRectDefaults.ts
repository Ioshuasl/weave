import type { ComponentType, Rect } from '../types/report';

export function getDefaultComponentSize(type: ComponentType): Pick<Rect, 'width' | 'height'> {
  switch (type) {
    case 'line':
      return { width: 200, height: 2 };
    case 'image':
    case 'qr':
    case 'shape':
      return { width: 100, height: 100 };
    case 'table':
      return { width: 300, height: 100 };
    case 'chart':
      return { width: 300, height: 200 };
    default:
      return { width: 100, height: 20 };
  }
}

/** Piso do QR no canvas (px). Precisa ficar alinhado ao resize. */
export const QR_MIN_SIZE = 20;

/** QR precisa ser quadrado — usa o maior lado para não ficar 100×20 (padrão de texto). */
export function squareQrRect(rect: Rect): Rect {
  const size = Math.max(QR_MIN_SIZE, Math.round(Math.max(rect.width, rect.height)));
  return { ...rect, width: size, height: size };
}
