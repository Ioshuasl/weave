import React from 'react';
import type { DataSourceCatalog } from './modules/data-source/domain';
import { DataSourceCatalogProvider } from './modules/data-source/ui';
import type { PagePresetDefinition } from './modules/page/domain';
import { PagePresetCatalogProvider } from './modules/page/ui';
import type { ReportImageResolver } from './modules/components/image/application';
import { ImageResolverProvider } from './modules/components/image/ui';

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
  return (
    <PagePresetCatalogProvider presets={pagePresets}>
      <DataSourceCatalogProvider catalog={dataSources}>
        <ImageResolverProvider resolver={imageResolver}>{children}</ImageResolverProvider>
      </DataSourceCatalogProvider>
    </PagePresetCatalogProvider>
  );
}
