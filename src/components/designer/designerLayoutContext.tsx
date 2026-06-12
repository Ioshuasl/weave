import React, { createContext, useContext } from 'react';

interface DesignerLayoutContextValue {
  compactMode: boolean;
}

const DesignerLayoutContext = createContext<DesignerLayoutContextValue>({
  compactMode: false,
});

export function DesignerLayoutProvider({
  compactMode,
  children,
}: {
  compactMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <DesignerLayoutContext.Provider value={{ compactMode }}>
      {children}
    </DesignerLayoutContext.Provider>
  );
}

export function useDesignerCompactMode(): boolean {
  return useContext(DesignerLayoutContext).compactMode;
}
