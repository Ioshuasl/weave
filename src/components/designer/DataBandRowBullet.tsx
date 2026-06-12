import React from 'react';
import type { BulletListMarker, BulletListProps } from '../../types/report';
import { resolveBulletListConfig } from '../../utils/dataBandUtils';
import { cn } from '../../utils/cn';

interface DataBandRowBulletProps {
  config?: BulletListProps;
  className?: string;
}

function ListMarker({
  marker,
  color,
  size,
}: {
  marker: BulletListMarker;
  color: string;
  size: number;
}) {
  if (marker === 'none') return null;

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
  };

  switch (marker) {
    case 'circle-filled':
      return (
        <span
          className="rounded-full"
          style={{ ...baseStyle, backgroundColor: color }}
          aria-hidden
        />
      );
    case 'circle-outline':
      return (
        <span
          className="rounded-full box-border"
          style={{
            ...baseStyle,
            border: `1.5px solid ${color}`,
            backgroundColor: 'transparent',
          }}
          aria-hidden
        />
      );
    case 'square-filled':
      return (
        <span style={{ ...baseStyle, backgroundColor: color }} aria-hidden />
      );
    default:
      return null;
  }
}

/** Marcador visual à esquerda de cada linha (banda dataList) */
export function DataBandRowBullet({ config, className }: DataBandRowBulletProps) {
  const resolved = resolveBulletListConfig(config);
  if (resolved.marker === 'none') return null;

  const width = resolved.width ?? 20;
  const color = resolved.color ?? '#404040';
  const size = resolved.size ?? 6;

  return (
    <div
      className={cn(
        'absolute top-0 left-0 flex items-center justify-center h-full pointer-events-none select-none',
        className
      )}
      style={{ width }}
      aria-hidden
    >
      <ListMarker marker={resolved.marker!} color={color} size={size} />
    </div>
  );
}
