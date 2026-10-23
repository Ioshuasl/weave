import React, { createContext, useContext } from 'react';
import type { PageVariablesResolver } from '../../expression/domain';

const PageVariablesContext = createContext<PageVariablesResolver | undefined>(undefined);

/** Disponibiliza o resolvedor de variáveis por folha (`{page.*}`) do host para o preview/impressão. */
export function PageVariablesProvider({
  resolver,
  children,
}: {
  resolver?: PageVariablesResolver;
  children: React.ReactNode;
}) {
  return <PageVariablesContext.Provider value={resolver}>{children}</PageVariablesContext.Provider>;
}

export function usePageVariablesResolver(): PageVariablesResolver | undefined {
  return useContext(PageVariablesContext);
}
