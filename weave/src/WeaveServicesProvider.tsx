import React from 'react';
import type { DesignerServices } from './modules/designer/application';
import {
  browserPanelStorage,
  browserRecentFieldStorage,
  driverTourLauncher,
} from './modules/designer/infrastructure';
import { DesignerServicesProvider } from './modules/designer/ui';
import { embedImageFile } from './modules/components/image/infrastructure';
import { browserReportFileGateway } from './modules/report/infrastructure';
import type { RenderingServices } from './modules/rendering/application';
import { waitForElementImages } from './modules/rendering/infrastructure';
import { RenderingServicesProvider } from './modules/rendering/ui';

/** Composição das portas de infraestrutura (adaptadores de navegador) usadas pelas camadas de UI. */
const DESIGNER_SERVICES: DesignerServices = {
  panelStorage: browserPanelStorage,
  recentFields: browserRecentFieldStorage,
  tour: driverTourLauncher,
  reportFiles: browserReportFileGateway,
  imageEmbedder: embedImageFile,
};

const RENDERING_SERVICES: RenderingServices = {
  waitForImages: waitForElementImages,
};

export function WeaveServicesProvider({ children }: { children: React.ReactNode }) {
  return (
    <DesignerServicesProvider services={DESIGNER_SERVICES}>
      <RenderingServicesProvider services={RENDERING_SERVICES}>{children}</RenderingServicesProvider>
    </DesignerServicesProvider>
  );
}
