import React, { createContext, useContext } from 'react';
import type { DataSourceCatalog } from '../domain/dataSourceUtils';

const EMPTY_CATALOG: DataSourceCatalog = {};

const DataSourceCatalogContext = createContext<DataSourceCatalog>(EMPTY_CATALOG);

export function DataSourceCatalogProvider({
  catalog,
  children,
}: {
  catalog?: DataSourceCatalog;
  children: React.ReactNode;
}) {
  return (
    <DataSourceCatalogContext.Provider value={catalog ?? EMPTY_CATALOG}>
      {children}
    </DataSourceCatalogContext.Provider>
  );
}

export function useDataSourceCatalog(): DataSourceCatalog {
  return useContext(DataSourceCatalogContext);
}
