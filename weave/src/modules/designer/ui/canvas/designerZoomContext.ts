import { createContext, useContext } from 'react';

/** Zoom commitado do canvas (gesto de roda usa transform direto até o debounce). */
export const DesignerZoomContext = createContext(1);

export const useDesignerZoom = () => useContext(DesignerZoomContext);