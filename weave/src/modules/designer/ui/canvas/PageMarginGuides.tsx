import React from 'react';
import type { ReportPage } from '../../../page/domain';
import { cn } from '../../../../shared/ui/cn';

interface PageMarginGuidesProps {
  page: ReportPage;
  active?: boolean;
}

/** Guias visuais da área útil (margens) quando a folha está selecionada */
export const PageMarginGuides: React.FC<PageMarginGuidesProps> = ({ page, active }) => {
  if (!active) return null;

  const { top, right, bottom, left } = page.margins;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      <div
        className={cn(
          'absolute border-2 border-dashed border-sky-400/70 rounded-sm',
          'shadow-[inset_0_0_0_1px_rgba(14,165,233,0.08)]'
        )}
        style={{
          top,
          right,
          bottom,
          left,
        }}
      />
      <div className="absolute top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-sky-50/90 text-[9px] font-medium text-sky-700 border border-sky-200/80">
        Área útil
      </div>
    </div>
  );
};
