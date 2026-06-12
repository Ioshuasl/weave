import React, { createContext, useContext, useMemo } from 'react';
import type { DataSourceCatalog } from '../../utils/dataSourceUtils';
import {
  BUILTIN_PAGE_PRESET_CATALOG,
  buildPagePresetCatalog,
  type PagePresetCatalog,
  type PagePresetDefinition,
} from '../../utils/pagePresets';

interface DesignerHostContextValue {
  pagePresetCatalog: PagePresetCatalog;
  dataSourceCatalog: DataSourceCatalog;
}

const DesignerHostContext = createContext<DesignerHostContextValue>({
  pagePresetCatalog: BUILTIN_PAGE_PRESET_CATALOG,
  dataSourceCatalog: {},
});

export function DesignerHostProvider({
  pagePresets,
  dataSources,
  children,
}: {
  pagePresets?: PagePresetDefinition[];
  dataSources?: DataSourceCatalog;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      pagePresetCatalog: buildPagePresetCatalog(pagePresets),
      dataSourceCatalog: dataSources ?? {},
    }),
    [pagePresets, dataSources]
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
