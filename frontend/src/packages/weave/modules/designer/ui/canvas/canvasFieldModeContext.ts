import { createContext, useContext } from 'react';

/** `data` = campos mostram valores de exemplo; `fields` = mostram a origem `{dataset.campo}`. */
export type CanvasFieldMode = 'data' | 'fields';

export const CanvasFieldModeContext = createContext<CanvasFieldMode>('data');

export function useCanvasFieldMode(): CanvasFieldMode {
  return useContext(CanvasFieldModeContext);
}
