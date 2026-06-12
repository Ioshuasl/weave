/** Distância mínima (px na tela) antes de iniciar arrasto — clique simples não move o item */
export const DESIGNER_DRAG_START_DISTANCE_PX = 5;

export function hasExceededScreenDragThreshold(
  startClientX: number,
  startClientY: number,
  clientX: number,
  clientY: number,
  threshold = DESIGNER_DRAG_START_DISTANCE_PX
): boolean {
  const dx = clientX - startClientX;
  const dy = clientY - startClientY;
  return Math.hypot(dx, dy) >= threshold;
}
