import React, { createContext, useContext } from 'react';
import type { RenderingServices } from '../application';

const RenderingServicesContext = createContext<RenderingServices | null>(null);

export function RenderingServicesProvider({
  services,
  children,
}: {
  services: RenderingServices;
  children: React.ReactNode;
}) {
  return (
    <RenderingServicesContext.Provider value={services}>{children}</RenderingServicesContext.Provider>
  );
}

export function useRenderingServices(): RenderingServices {
  const services = useContext(RenderingServicesContext);
  if (!services) {
    throw new Error('useRenderingServices precisa estar dentro de <RenderingServicesProvider>.');
  }
  return services;
}
