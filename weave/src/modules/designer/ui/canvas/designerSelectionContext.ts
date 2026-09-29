import { createContext, useContext } from 'react';
import {
  DEFAULT_CANVAS_SELECTION_CLASSES,
  type CanvasSelectionClasses,
} from './canvasSelectionClasses';

export const DesignerSelectionContext = createContext<CanvasSelectionClasses>(
  DEFAULT_CANVAS_SELECTION_CLASSES
);

export function useCanvasSelectionClasses(): CanvasSelectionClasses {
  return useContext(DesignerSelectionContext);
}
