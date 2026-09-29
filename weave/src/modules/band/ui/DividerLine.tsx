import type { DividerLineVector } from '../domain/band';
import { cn } from '../../../shared/ui/cn';

export { normalizeDividerAngle } from '../domain/vectorLineUtils';

export interface DividerLineProps {
  line: DividerLineVector;
  color?: string;
  thickness?: number;
  className?: string;
}

/** Linha divisória vetorial (SVG) — sem clip por overflow */
export function DividerLine({
  line,
  color = '#a3a3a3',
  thickness = 1,
  className,
}: DividerLineProps) {
  const strokeWidth = Math.max(1, thickness);

  return (
    <svg
      className={cn('absolute inset-0 w-full h-full overflow-visible pointer-events-none', className)}
      aria-hidden
    >
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
