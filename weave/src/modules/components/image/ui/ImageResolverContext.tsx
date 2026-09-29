import React, { createContext, useContext } from 'react';
import type { ReportImageResolver } from '../application/imageResolver';

const ImageResolverContext = createContext<ReportImageResolver | null>(null);

export function ImageResolverProvider({
  resolver,
  children,
}: {
  resolver?: ReportImageResolver | null;
  children: React.ReactNode;
}) {
  return (
    <ImageResolverContext.Provider value={resolver ?? null}>{children}</ImageResolverContext.Provider>
  );
}

export function useImageResolver(): ReportImageResolver | null {
  return useContext(ImageResolverContext);
}
