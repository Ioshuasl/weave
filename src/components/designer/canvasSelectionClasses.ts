/** Classes Tailwind para contorno de hover/seleção no canvas (componentes e bandas) */
export interface CanvasSelectionClasses {
  /** Componente selecionado */
  active: string;
  /** Componente em repouso (hover) */
  idle: string;
  /** Banda selecionada */
  bandActive: string;
  /** Banda em repouso (hover) */
  bandIdle: string;
}

export const DEFAULT_CANVAS_SELECTION_CLASSES: CanvasSelectionClasses = {
  active: 'ring-2 ring-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]',
  idle:
    'ring-1 ring-transparent hover:ring-2 hover:ring-indigo-400 transition-[box-shadow] duration-150',
  bandActive: 'ring-2 ring-indigo-500 border-indigo-400 shadow-sm',
  bandIdle:
    'hover:border-indigo-400 hover:ring-2 hover:ring-indigo-400/60 transition-[border-color,box-shadow] duration-150',
};

export function resolveCanvasSelectionClasses(
  overrides?: Partial<CanvasSelectionClasses>
): CanvasSelectionClasses {
  if (!overrides) return DEFAULT_CANVAS_SELECTION_CLASSES;
  return { ...DEFAULT_CANVAS_SELECTION_CLASSES, ...overrides };
}
