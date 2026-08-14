import React, { createContext, useContext, useMemo } from 'react';
import type { DataSourceCatalog } from '../../utils/dataSourceUtils';
import type { ReportImageResolver } from '../../utils/imageHostResolver';
import {
  BUILTIN_PAGE_PRESET_CATALOG,
  buildPagePresetCatalog,
  type PagePresetCatalog,
  type PagePresetDefinition,
} from '../../utils/pagePresets';

interface DesignerHostContextValue {
  pagePresetCatalog: PagePresetCatalog;
  dataSourceCatalog: DataSourceCatalog;
  imageResolver: ReportImageResolver | null;
}

const DesignerHostContext = createContext<DesignerHostContextValue>({
  pagePresetCatalog: BUILTIN_PAGE_PRESET_CATALOG,
  dataSourceCatalog: {},
  imageResolver: null,
});

export function DesignerHostProvider({
  pagePresets,
  dataSources,
  imageResolver,
  children,
}: {
  pagePresets?: PagePresetDefinition[];
  dataSources?: DataSourceCatalog;
  imageResolver?: ReportImageResolver | null;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      pagePresetCatalog: buildPagePresetCatalog(pagePresets),
      dataSourceCatalog: dataSources ?? {},
      imageResolver: imageResolver ?? null,
    }),
    [pagePresets, dataSources, imageResolver]
  );

  return (
    <DesignerHostContext.Provider value={value}>{children}</DesignerHostContext.Provider>
  );
}

export function usePagePresetCatalog(): PagePresetCatalog {
  return useContext(DesignerHostContext).pagePresetCatalog;
}

export function useDataSourceCatalog(): DataSourceCatalog {
  return useContext(DesignerHostContext).dataSourceCatalog;
}

export function useImageResolver(): ReportImageResolver | null {
  return useContext(DesignerHostContext).imageResolver;
}
