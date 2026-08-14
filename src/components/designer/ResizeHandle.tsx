import React from 'react';
import { cn } from '../../utils/cn';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
  title?: string;
}

/** Alça de redimensionamento canto inferior-direito — visual minimalista (estilo Notion) */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  className,
  title = 'Redimensionar',
}) => (
  <div
    role="presentation"
    data-resize-handle
    title={title}
    aria-label={title}
    className={cn(
      'no-drag absolute bottom-0 right-0 z-20 translate-x-1/2 translate-y-1/2 pointer-events-auto',
      'flex items-center justify-center w-3.5 h-3.5 rounded-full',
      'bg-white border border-neutral-300/90',
      'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
      'cursor-se-resize',
      'opacity-90 hover:opacity-100 hover:border-neutral-400 hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]',
      'transition-[opacity,box-shadow,border-color,transform] duration-150',
      'active:scale-95',
      className
    )}
    onMouseDown={onMouseDown}
  >
    <span className="block w-1 h-1 rounded-full bg-neutral-400/90" aria-hidden />
  </div>
);

/** @deprecated Use DEFAULT_CANVAS_SELECTION_CLASSES ou prop canvasSelectionClasses no ReportDesigner */
export { DEFAULT_CANVAS_SELECTION_CLASSES as canvasSelectionClasses } from './canvasSelectionClasses';
