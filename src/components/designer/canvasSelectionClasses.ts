/** Classes Tailwind para contorno de hover/seleção no canvas (componentes e bandas) */
export interface CanvasSelectionClasses {
  /** Componente selecionado */
  active: string;
  /** Componente em repouso */
  idle: string;
  /** Componente sob o cursor (hit-test) */
  hovered: string;
  /** Banda selecionada */
  bandActive: string;
  /** Banda em repouso */
  bandIdle: string;
  /** Banda sob o cursor (hit-test) */
  bandHovered: string;
}

export const DEFAULT_CANVAS_SELECTION_CLASSES: CanvasSelectionClasses = {
  active: 'ring-2 ring-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]',
  idle: 'ring-1 ring-transparent transition-[box-shadow] duration-150',
  hovered: 'ring-2 ring-indigo-400 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]',
  bandActive: 'ring-2 ring-indigo-500 border-indigo-400 shadow-sm',
  bandIdle: 'transition-[border-color,box-shadow] duration-150',
  bandHovered: 'border-indigo-400 ring-2 ring-indigo-400/60',
};

export function resolveCanvasSelectionClasses(
  overrides?: Partial<CanvasSelectionClasses>
): CanvasSelectionClasses {
  if (!overrides) return DEFAULT_CANVAS_SELECTION_CLASSES;
  return { ...DEFAULT_CANVAS_SELECTION_CLASSES, ...overrides };
}
