import React from 'react';
import { cn } from '../../../../shared/ui/cn';
import { type ReportBand, getBandDisplayLabel } from '../../../band/domain';
import { useDesignerCompactMode } from '../layout/designerLayoutContext';

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
      {band && !band.element && (
        <>
          <span className="text-neutral-500">Bloco:</span>{' '}
          <span className="text-neutral-600">{band.name || getBandDisplayLabel(band.type)}</span>
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
