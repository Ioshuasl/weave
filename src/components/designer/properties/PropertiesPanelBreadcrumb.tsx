import React from 'react';
import type { ReportBand } from '../../../types/report';
import { getBandDisplayLabel } from '../../../utils/dataBandUtils';
import { useDesignerCompactMode } from '../designerLayoutContext';
import { cn } from '../../../utils/cn';

export function PropertiesPanelBreadcrumb({
  band,
  pageName,
}: {
  band?: ReportBand | null;
  pageName: string;
}) {
  const compactMode = useDesignerCompactMode();

  if (!band && !pageName) return null;

  return (
    <p
      className={cn(
        'text-neutral-400 truncate leading-snug',
        compactMode ? 'text-[10px]' : 'text-[11px]'
      )}
    >
      {band && (
        <>
          <span className="text-neutral-500">Banda:</span>{' '}
          <span className="text-neutral-600">{getBandDisplayLabel(band.type)}</span>
          <span className="mx-1.5 text-neutral-300" aria-hidden>
            ·
          </span>
        </>
      )}
      <span className="text-neutral-500">Página:</span>{' '}
      <span className="text-neutral-600">{pageName}</span>
    </p>
  );
}
