import React from 'react';
import { ImageResolverProvider } from './modules/components/image/ui';
import { DataSourceCatalogProvider } from './modules/data-source/ui';
import { PagePresetCatalogProvider } from './modules/page/ui';
import { PageVariablesProvider } from './modules/rendering/ui';
import type { PageVariablesResolver } from './modules/expression/domain';
import type { ReportImageResolver } from './modules/components/image/application';
import type { DataSourceCatalog } from './modules/data-source/domain';
import type { PagePresetDefinition } from './modules/page/domain';

export function DesignerHostProvider({
  pagePresets,
  dataSources,
  imageResolver,
  resolvePageVariables,
  children,
}: {
  pagePresets?: PagePresetDefinition[];
  dataSources?: DataSourceCatalog;
  imageResolver?: ReportImageResolver | null;
  resolvePageVariables?: PageVariablesResolver;
  children: React.ReactNode;
}) {
  return (
    <PagePresetCatalogProvider presets={pagePresets}>
      <DataSourceCatalogProvider catalog={dataSources}>
        <ImageResolverProvider resolver={imageResolver}>
          <PageVariablesProvider resolver={resolvePageVariables}>{children}</PageVariablesProvider>
        </ImageResolverProvider>
      </DataSourceCatalogProvider>
    </PagePresetCatalogProvider>
  );
}
