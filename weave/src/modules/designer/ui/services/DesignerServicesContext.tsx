import React, { createContext, useContext } from 'react';
import type { DesignerServices } from '../../application';

const DesignerServicesContext = createContext<DesignerServices | null>(null);

export function DesignerServicesProvider({
  services,
  children,
}: {
  services: DesignerServices;
  children: React.ReactNode;
}) {
  return (
    <DesignerServicesContext.Provider value={services}>{children}</DesignerServicesContext.Provider>
  );
}

export function useDesignerServices(): DesignerServices {
  const services = useContext(DesignerServicesContext);
  if (!services) {
    throw new Error('useDesignerServices precisa estar dentro de <DesignerServicesProvider>.');
  }
  return services;
}
