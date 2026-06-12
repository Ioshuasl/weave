import React from 'react';
import type { NumberedListProps } from '../../types/report';
import { formatRowNumber } from '../../utils/dataBandUtils';
import { cn } from '../../utils/cn';

interface DataBandRowNumberProps {
  rowIndex?: number;
  config?: NumberedListProps;
  className?: string;
}

/** Numeração automática exibida à esquerda de cada linha (banda dataListNumbered) */
export function DataBandRowNumber({
  rowIndex = 0,
  config,
  className,
}: DataBandRowNumberProps) {
  const width = config?.width ?? 28;

  return (
    <div
      className={cn(
        'absolute top-0 left-0 flex items-center justify-end pr-1.5 h-full pointer-events-none select-none',
        className
      )}
      style={{
        width,
        ...config?.style,
      }}
      aria-hidden
    >
      {formatRowNumber(rowIndex, config)}
    </div>
  );
}
