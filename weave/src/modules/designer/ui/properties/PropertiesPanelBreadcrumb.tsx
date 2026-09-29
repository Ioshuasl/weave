import React from 'react';
import { type ReportBand, getBandDisplayLabel } from '../../../band/domain';
import { useDesignerCompactMode } from '../layout/designerLayoutContext';
import { cn } from '../../../../shared/ui/cn';

export function PropertiesPanelBreadcrumb({
  band,
  pageName,
  className,
}: {
  band?: ReportBand | null;
  pageName: string;
  className?: string;
}) {
  const compactMode = useDesignerCompactMode();

  if (!band && !pageName) return null;

  return (
    <p
      className={cn(
        'text-neutral-400 truncate leading-snug',
        compactMode ? 'text-[10px]' : 'text-[11px]',
        className
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
