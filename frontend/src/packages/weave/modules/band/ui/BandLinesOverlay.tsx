import React from 'react';
import type { LineRect } from '../domain/bandLines';

export interface BandLineGroup {
  color: string;
  rects: LineRect[];
}

/** Desenha as linhas de divisão (cada uma é uma faixa fina, sem interferir nos cliques). */
export const BandLinesOverlay = React.memo(function BandLinesOverlay({ groups }: { groups: BandLineGroup[] }) {
  if (!groups.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0" data-band-lines aria-hidden>
      {groups.flatMap((group, g) =>
        group.rects.map((rect, i) => (
          <div
            key={`${g}-${i}`}
            data-band-line
            style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height, backgroundColor: group.color }}
          />
        ))
      )}
    </div>
  );
});
