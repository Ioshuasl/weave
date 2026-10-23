import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Underline, type LucideIcon } from 'lucide-react';
import React from 'react';
import { cn } from '../../../../../shared/ui/cn';
import { TEXT_FONT_OPTIONS, getTextLineHeight, getTextRotation } from '../../../../components/text/domain';
import {
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyNumberInput,
  PropertySegmentedControl,
  PropertySelect,
} from '../controls/PropertyFields';
import type { ReportComponent } from '../../../../components/common/domain';

type TextAlign = 'left' | 'center' | 'right' | 'justify';

const ALIGN_OPTIONS: { value: TextAlign; label: string; icon: LucideIcon; title: string }[] = [
  { value: 'left', label: '', icon: AlignLeft, title: 'Esquerda' },
  { value: 'center', label: '', icon: AlignCenter, title: 'Centro' },
  { value: 'right', label: '', icon: AlignRight, title: 'Direita' },
  { value: 'justify', label: '', icon: AlignJustify, title: 'Justificar' },
];

const ROTATION_OPTIONS = ['0', '90', '180', '270'].map((deg) => ({ value: deg, label: `${deg}°` }));

const DEFAULT_FONT_SIZE = 12;

/** Estilo do texto inteiro com controles visuais (sem marcadores de formatação). */
export function TextStyleSection({
  component,
  componentId,
  onPatchStyle,
  onUpdate,
}: {
  component: ReportComponent;
  componentId: string;
  onPatchStyle: (patch: React.CSSProperties) => void;
  onUpdate: (updates: Partial<ReportComponent>) => void;
}) {
  const { style } = component;
  const rotation = getTextRotation(component.textProps);
  const patchRotation = (next: number) => onUpdate({ textProps: { ...component.textProps, rotation: next } });
  const fontFamily = String(style.fontFamily ?? '');
  const fontOptions = TEXT_FONT_OPTIONS.some((opt) => opt.value === fontFamily)
    ? TEXT_FONT_OPTIONS
    : [...TEXT_FONT_OPTIONS, { value: fontFamily, label: 'Personalizada' }];
  const toggles: {
    label: string;
    icon: LucideIcon;
    active: boolean;
    patch: React.CSSProperties;
  }[] = [
    {
      label: 'Negrito',
      icon: Bold,
      active: style.fontWeight === 'bold' || Number(style.fontWeight) >= 600,
      patch: { fontWeight: style.fontWeight === 'bold' ? undefined : 'bold' },
    },
    {
      label: 'Itálico',
      icon: Italic,
      active: style.fontStyle === 'italic',
      patch: { fontStyle: style.fontStyle === 'italic' ? undefined : 'italic' },
    },
    {
      label: 'Sublinhado',
      icon: Underline,
      active: style.textDecoration === 'underline',
      patch: { textDecoration: style.textDecoration === 'underline' ? undefined : 'underline' },
    },
  ];

  return (
    <div className="space-y-3">
      <PropertySelect
        label="Fonte"
        value={fontFamily}
        onChange={(value) => onPatchStyle({ fontFamily: value || undefined })}
        options={fontOptions}
      />

      <PropertyFieldGrid>
        <PropertyNumberInput
          label="Tamanho"
          suffix="px"
          min={6}
          max={72}
          value={parseFloat(String(style.fontSize ?? '')) || DEFAULT_FONT_SIZE}
          onChange={(size) => onPatchStyle({ fontSize: `${size}px` })}
        />
        <PropertyNumberInput
          label="Entre linhas"
          min={1}
          max={3}
          step={0.05}
          value={getTextLineHeight(style.lineHeight)}
          onChange={(lineHeight) => onPatchStyle({ lineHeight })}
        />
      </PropertyFieldGrid>

      <PropertyColorInput
        label="Cor do texto"
        value={String(style.color || '#000000')}
        previewComponentId={componentId}
        previewStyleKey="color"
        onChange={(color) => onPatchStyle({ color })}
      />

      <PropertySegmentedControl
        label="Alinhamento"
        value={(style.textAlign as TextAlign) ?? 'left'}
        onChange={(textAlign) => onPatchStyle({ textAlign })}
        options={ALIGN_OPTIONS}
      />

      <PropertySegmentedControl
        label="Girar"
        value={String(Math.round(rotation))}
        onChange={(deg) => patchRotation(Number(deg))}
        options={ROTATION_OPTIONS}
      />
      <PropertyNumberInput
        label="Rotação livre"
        suffix="°"
        min={-360}
        max={360}
        value={Math.round(rotation)}
        onChange={patchRotation}
      />

      <div>
        <span className="mb-1 block text-[12px] font-medium text-neutral-600">Destaque</span>
        <div className="flex gap-1">
          {toggles.map(({ label, icon: Icon, active, patch }) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active}
              onClick={() => onPatchStyle(patch)}
              className={cn(
                'inline-flex h-8 w-9 items-center justify-center rounded-lg transition-colors',
                active ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70',
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
