import { Layers } from 'lucide-react';
import React from 'react';

/** Banda que só agrupa outras (sem componentes): mostra o que ela repete em vez de "arraste campos". */
export function GroupBandHint({
  groupLabel,
  childLabels,
}: {
  groupLabel: string;
  childLabels: string[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center gap-2 px-3 text-[11px] text-indigo-800">
      <Layers className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
      <span className="truncate">
        Para cada <strong>{groupLabel}</strong>
        {childLabels.length > 0 && (
          <>
            {' '}
            ▸ mostra <strong>{childLabels.join(', ')}</strong>
          </>
        )}
      </span>
    </div>
  );
}
