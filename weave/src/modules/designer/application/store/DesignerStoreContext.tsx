import React, { createContext, useContext, useState } from 'react';
import { useStore } from 'zustand';
import type { DesignerState } from './designerState';
import { createDesignerStore, type DesignerStoreApi } from './designerStore';

const DesignerStoreContext = createContext<DesignerStoreApi | null>(null);

/** Fornece um store novo por instância montada. */
export function DesignerStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createDesignerStore);
  return <DesignerStoreContext.Provider value={store}>{children}</DesignerStoreContext.Provider>;
}

/** Acesso imperativo ao store da instância (getState/setState/subscribe). */
export function useDesignerStoreApi(): DesignerStoreApi {
  const store = useContext(DesignerStoreContext);
  if (!store) {
    throw new Error('useDesignerStoreApi precisa estar dentro de <DesignerStoreProvider>.');
  }
  return store;
}

/** Seleciona estado reativo do store da instância. */
export function useDesignerStore<T>(selector: (state: DesignerState) => T): T {
  return useStore(useDesignerStoreApi(), selector);
}
