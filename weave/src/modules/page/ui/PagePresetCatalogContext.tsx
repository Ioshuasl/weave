import React, { createContext, useContext, useMemo } from 'react';
import {
  BUILTIN_PAGE_PRESET_CATALOG,
  buildPagePresetCatalog,
  type PagePresetCatalog,
  type PagePresetDefinition,
} from '../domain/pagePresets';

const PagePresetCatalogContext = createContext<PagePresetCatalog>(BUILTIN_PAGE_PRESET_CATALOG);

export function PagePresetCatalogProvider({
  presets,
  children,
}: {
  presets?: PagePresetDefinition[];
  children: React.ReactNode;
}) {
  const catalog = useMemo(() => buildPagePresetCatalog(presets), [presets]);

  return (
    <PagePresetCatalogContext.Provider value={catalog}>{children}</PagePresetCatalogContext.Provider>
  );
}

export function usePagePresetCatalog(): PagePresetCatalog {
  return useContext(PagePresetCatalogContext);
}
