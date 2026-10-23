import React from 'react';
import { BORDER_SIDES, DEFAULT_BORDER, getBorderSides, setBorderSides, type BorderSide } from '../../../../components/common/domain';
import type { StyleDeclaration } from '../../../../../shared/domain/style';
import { PropertyBorderInput } from './PropertyBorderInput';
import { PropertyCheckbox, PropertyHint } from './PropertyFields';

const LABELS: Record<BorderSide, string> = { top: 'Superior', right: 'Direita', bottom: 'Inferior', left: 'Esquerda' };

/**
 * Bordas por lado: liga/desliga cada lado à parte; a espessura, o estilo e a cor valem para os lados ligados.
 * Grava `border` quando os 4 lados são iguais e `borderTop/Right/Bottom/Left` nos demais casos (ver `componentBorders.ts`).
 */
export function PropertyBorderSidesInput({
  label = 'Bordas',
  style,
  onChange,
}: {
  label?: string;
  style: StyleDeclaration;
  onChange: (style: StyleDeclaration) => void;
}) {
  const sides = getBorderSides(style);
  const enabled = BORDER_SIDES.filter((side) => sides[side]);
  const spec = (enabled.length ? sides[enabled[0]] : undefined) ?? DEFAULT_BORDER;
  const setAll = (on: boolean) => onChange(setBorderSides(style, Object.fromEntries(BORDER_SIDES.map((side) => [side, on ? spec : undefined]))));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-700">{label}</span>
        <span className="flex gap-1 text-[11px]">
          <button type="button" onClick={() => setAll(true)} className="rounded px-1.5 py-0.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
            Todas
          </button>
          <button type="button" onClick={() => setAll(false)} className="rounded px-1.5 py-0.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
            Nenhuma
          </button>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {BORDER_SIDES.map((side) => (
          <PropertyCheckbox key={side} label={LABELS[side]} checked={Boolean(sides[side])} onChange={(checked) => onChange(setBorderSides(style, { [side]: checked ? spec : undefined }))} />
        ))}
      </div>
      {enabled.length > 0 ? (
        <PropertyBorderInput
          label="Espessura e cor"
          value={spec}
          defaultColor="#000000"
          onChange={(next) => onChange(setBorderSides(style, Object.fromEntries(enabled.map((side) => [side, next || DEFAULT_BORDER]))))}
        />
      ) : (
        <PropertyHint>Marque um lado para escolher a espessura e a cor.</PropertyHint>
      )}
    </div>
  );
}
