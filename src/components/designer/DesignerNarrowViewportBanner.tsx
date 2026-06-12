import React from 'react';
import { Monitor } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { NARROW_VIEWPORT_MEDIA_QUERY } from './designerLayout';

export const DesignerNarrowViewportBanner: React.FC = () => {
  const isNarrow = useMediaQuery(NARROW_VIEWPORT_MEDIA_QUERY);

  if (!isNarrow) return null;

  return (
    <div
      className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-200/80 text-[11px] text-amber-900"
      role="status"
    >
      <Monitor className="w-3.5 h-3.5 shrink-0 text-amber-600" />
      <span>
        Largura reduzida — use modo paisagem ou uma janela mais larga (≥1024px) para melhor
        experiência. Painéis: <kbd className="font-mono text-[10px]">[</kbd> paleta ·{' '}
        <kbd className="font-mono text-[10px]">]</kbd> propriedades.
      </span>
    </div>
  );
};
