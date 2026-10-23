import type { Rect } from '../../../shared/domain/geometry';

export type ArrangeMode =
  | 'alignLeft'
  | 'alignTop'
  | 'alignBottom'
  | 'sameHeight'
  | 'distributeHorizontal'
  | 'distributeVertical';

export const ARRANGE_MODE_LABELS: Record<ArrangeMode, string> = {
  alignLeft: 'Alinhar à esquerda',
  alignTop: 'Alinhar pelo topo',
  alignBottom: 'Alinhar pela base',
  sameHeight: 'Igualar alturas',
  distributeHorizontal: 'Distribuir lado a lado',
  distributeVertical: 'Distribuir um abaixo do outro',
};

/** Modos que precisam de 3+ itens para fazer sentido (espaçamento entre vizinhos) */
export const ARRANGE_MODES_NEED_THREE: ArrangeMode[] = [
  'distributeHorizontal',
  'distributeVertical',
];

/**
 * Calcula os novos retângulos ao alinhar/distribuir itens de uma mesma banda.
 * Distribuir mantém o primeiro e o último no lugar e iguala os espaços entre eles.
 */
export function arrangeRects(
  mode: ArrangeMode,
  items: { id: string; rect: Rect }[],
): { id: string; rect: Partial<Rect> }[] {
  if (items.length < 2) return [];
  const left = Math.min(...items.map((item) => item.rect.x));
  const top = Math.min(...items.map((item) => item.rect.y));
  const bottom = Math.max(...items.map((item) => item.rect.y + item.rect.height));
  const maxHeight = Math.max(...items.map((item) => item.rect.height));

  switch (mode) {
    case 'alignLeft':
      return items.map(({ id }) => ({ id, rect: { x: left } }));
    case 'alignTop':
      return items.map(({ id }) => ({ id, rect: { y: top } }));
    case 'alignBottom':
      return items.map(({ id, rect }) => ({ id, rect: { y: bottom - rect.height } }));
    case 'sameHeight':
      return items.map(({ id }) => ({ id, rect: { height: maxHeight } }));
    case 'distributeHorizontal':
    case 'distributeVertical': {
      const horizontal = mode === 'distributeHorizontal';
      const start = (rect: Rect) => (horizontal ? rect.x : rect.y);
      const size = (rect: Rect) => (horizontal ? rect.width : rect.height);
      const sorted = [...items].sort((a, b) => start(a.rect) - start(b.rect));
      const first = sorted[0].rect;
      const last = sorted[sorted.length - 1].rect;
      const span = start(last) + size(last) - start(first);
      const occupied = sorted.reduce((sum, item) => sum + size(item.rect), 0);
      const gap = (span - occupied) / (sorted.length - 1);
      let cursor = start(first);
      return sorted.map(({ id, rect }) => {
        const position = Math.round(cursor);
        cursor += size(rect) + gap;
        return { id, rect: horizontal ? { x: position } : { y: position } };
      });
    }
  }
}
