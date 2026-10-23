import React from 'react';
import { type BandFrame, type BandFrameThickness, type ReportBand, hasBandFrame } from '../../../../band/domain';
import { PropertyCheckbox, PropertyColorInput, PropertyHint, PropertySegmentedControl } from '../controls/PropertyFields';

const EDGES: { key: 'left' | 'right' | 'top' | 'bottom'; label: string }[] = [
  { key: 'left', label: 'Esquerda' },
  { key: 'right', label: 'Direita' },
  { key: 'top', label: 'Superior' },
  { key: 'bottom', label: 'Inferior' },
];

const THICKNESS: { value: BandFrameThickness; label: string }[] = [
  { value: 'thin', label: 'Fina' },
  { value: 'medium', label: 'Média' },
  { value: 'thick', label: 'Grossa' },
];

/** "Moldura da banda": escolha quais bordas (esquerda, direita, superior, inferior) ficam em volta da banda e das filhas dela. */
export function BandFrameSection({
  band,
  bandId,
  updateBand,
}: {
  band: ReportBand;
  bandId: string;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
}) {
  const frame = band.frame;
  const patch = (next: Partial<BandFrame>) => updateBand(bandId, { frame: { ...frame, ...next } });
  return (
    <div className="space-y-3">
      <PropertyHint>Borda em volta da banda e das bandas ligadas a ela (filhas). Marque só os lados que você quer.</PropertyHint>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {EDGES.map(({ key, label }) => (
          <PropertyCheckbox key={key} label={label} checked={frame?.[key] ?? false} onChange={(checked) => patch({ [key]: checked })} />
        ))}
      </div>
      {hasBandFrame(frame) && (
        <>
          <PropertySegmentedControl label="Espessura" value={frame?.thickness ?? 'medium'} onChange={(thickness) => patch({ thickness })} options={THICKNESS} />
          <PropertyColorInput label="Cor da moldura" value={frame?.color ?? '#000000'} onChange={(color) => patch({ color })} />
        </>
      )}
    </div>
  );
}
