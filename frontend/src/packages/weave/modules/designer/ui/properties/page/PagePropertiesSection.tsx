import { FileText, Grid3x3, RotateCw } from 'lucide-react';
import React, { useMemo } from 'react';
import {
  type PageSizeUnit,
  type ReportPage,
  cmToPx,
  CUSTOM_PAGE_PRESET_ID,
  getOrientationPairPresetId,
  pxToCm,
  type PagePresetGroup,
} from '../../../../page/domain';
import type { BandLinesPreset } from '../../../../band/domain';
import { usePagePresetCatalog } from '../../../../page/ui';
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { PropertyNameField } from '../controls/PropertyNameField';
import {
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
} from '../controls/PropertyFields';

interface PagePropertiesSectionProps {
  page: ReportPage;
  reportId?: string;
  onApplyPreset: (presetId: string) => void;
  onFlipOrientation: () => void;
  onApplyLinesPreset: (preset: BandLinesPreset) => void;
  onUpdatePage: (
    updates: Partial<ReportPage>,
    options?: { scaleContent?: boolean }
  ) => void;
}

const LINES_PRESETS: { value: BandLinesPreset; label: string; description: string }[] = [
  { value: 'grid', label: 'Grade de cartório', description: 'Linhas entre registros e colunas, título das colunas e grade até o fim da folha.' },
  { value: 'simple', label: 'Linhas simples', description: 'Uma linha separando cada registro.' },
  { value: 'none', label: 'Sem linhas', description: 'Remove todas as linhas da lista.' },
];

function formatUnitValue(px: number, unit: PageSizeUnit): number {
  return unit === 'cm' ? pxToCm(px) : Math.round(px);
}

function parseUnitValue(value: number, unit: PageSizeUnit): number {
  return unit === 'cm' ? cmToPx(value) : Math.round(value);
}

export const PagePropertiesSection: React.FC<PagePropertiesSectionProps> = ({
  page,
  reportId,
  onApplyPreset,
  onFlipOrientation,
  onApplyLinesPreset,
  onUpdatePage,
}) => {
  const pagePresetCatalog = usePagePresetCatalog();
  const sizeUnit = page.sizeUnit ?? 'cm';
  const presetId = page.presetId ?? CUSTOM_PAGE_PRESET_ID;
  const isCustom = presetId === CUSTOM_PAGE_PRESET_ID;
  const canFlip =
    isCustom || Boolean(getOrientationPairPresetId(page.presetId, pagePresetCatalog));

  const presetsByGroup = useMemo(() => {
    const map = new Map<PagePresetGroup, typeof pagePresetCatalog.presets>();
    for (const group of pagePresetCatalog.groups) {
      map.set(
        group.id,
        pagePresetCatalog.presets.filter((preset) => preset.group === group.id)
      );
    }
    return map;
  }, [pagePresetCatalog]);

  const unitSuffix = sizeUnit === 'cm' ? 'cm' : 'px';
  const unitStep = sizeUnit === 'cm' ? 0.1 : 1;

  const setSizeUnit = (unit: PageSizeUnit) => {
    onUpdatePage({ sizeUnit: unit });
  };

  const setDimension = (field: 'width' | 'height', displayValue: number) => {
    const px = parseUnitValue(displayValue, sizeUnit);
    onUpdatePage({ [field]: px, presetId: CUSTOM_PAGE_PRESET_ID }, { scaleContent: true });
  };

  const setMargin = (side: keyof ReportPage['margins'], displayValue: number) => {
    const px = parseUnitValue(displayValue, sizeUnit);
    onUpdatePage({
      margins: { ...page.margins, [side]: px },
      presetId: isCustom ? CUSTOM_PAGE_PRESET_ID : page.presetId,
    });
  };

  return (
    <div className="space-y-5">
      <PropertyNameField
        key={page.id}
        label="Nome da página"
        value={page.name}
        placeholder="Página"
        onCommit={(name) => name && onUpdatePage({ name })}
      />

      <PropertyAccordion
        title="Tamanho da folha"
        icon={FileText}
        sectionId="page-size"
        reportId={reportId}
        defaultOpen
      >
        <div>
          <label className="block text-[12px] font-medium text-neutral-600 mb-1">Tamanho do papel</label>
          <select
            value={presetId}
            onChange={(e) => {
              const nextId = e.target.value;
              if (nextId === CUSTOM_PAGE_PRESET_ID) {
                onUpdatePage({ presetId: CUSTOM_PAGE_PRESET_ID });
              } else {
                onApplyPreset(nextId);
              }
            }}
            className="w-full min-w-0 cursor-pointer rounded-lg border border-transparent bg-neutral-100/70 px-3 py-2 text-[13px] text-neutral-900 transition-[border-color,box-shadow,background-color] hover:bg-neutral-100 focus:border-indigo-500 focus:bg-weave-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {pagePresetCatalog.groups.map((group) => {
              const presets = presetsByGroup.get(group.id) ?? [];
              if (presets.length === 0) return null;
              return (
                <optgroup key={group.id} label={group.label}>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
            <option value={CUSTOM_PAGE_PRESET_ID}>Personalizado</option>
          </select>
          <PropertyHint className="mt-1">
            {page.width}×{page.height} px
          </PropertyHint>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onFlipOrientation}
            disabled={!canFlip && isCustom}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200/70 disabled:pointer-events-none disabled:opacity-40"
            title="Alternar retrato / paisagem"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Girar folha (retrato/paisagem)
          </button>
        </div>

        <PropertySegmentedControl
          label="Medir em"
          value={sizeUnit}
          onChange={setSizeUnit}
          options={[
            { value: 'cm', label: 'cm' },
            { value: 'px', label: 'px' },
          ]}
        />

        <PropertyFieldGrid>
          <PropertyNumberInput
            label="Largura"
            value={formatUnitValue(page.width, sizeUnit)}
            onChange={(v) => setDimension('width', v)}
            step={unitStep}
            suffix={unitSuffix}
            disabled={!isCustom}
          />
          <PropertyNumberInput
            label="Altura"
            value={formatUnitValue(page.height, sizeUnit)}
            onChange={(v) => setDimension('height', v)}
            step={unitStep}
            suffix={unitSuffix}
            disabled={!isCustom}
          />
        </PropertyFieldGrid>

        {!isCustom && (
          <PropertyHint>
            Escolha <strong>Personalizado</strong> no tamanho do papel para digitar largura e altura.
          </PropertyHint>
        )}
      </PropertyAccordion>

      <PropertyAccordion
        title="Margens"
        sectionId="page-margins"
        reportId={reportId}
        defaultOpen
        className="border-t border-neutral-100 pt-3"
      >
        <PropertyFieldGrid>
          <PropertyNumberInput
            label="Topo"
            value={formatUnitValue(page.margins.top, sizeUnit)}
            onChange={(v) => setMargin('top', v)}
            step={unitStep}
            suffix={unitSuffix}
          />
          <PropertyNumberInput
            label="Direita"
            value={formatUnitValue(page.margins.right, sizeUnit)}
            onChange={(v) => setMargin('right', v)}
            step={unitStep}
            suffix={unitSuffix}
          />
          <PropertyNumberInput
            label="Baixo"
            value={formatUnitValue(page.margins.bottom, sizeUnit)}
            onChange={(v) => setMargin('bottom', v)}
            step={unitStep}
            suffix={unitSuffix}
          />
          <PropertyNumberInput
            label="Esquerda"
            value={formatUnitValue(page.margins.left, sizeUnit)}
            onChange={(v) => setMargin('left', v)}
            step={unitStep}
            suffix={unitSuffix}
          />
        </PropertyFieldGrid>
        <PropertyHint>As linhas tracejadas na folha mostram a área onde o conteúdo cabe.</PropertyHint>
      </PropertyAccordion>

      <PropertyAccordion
        title="Linhas do relatório"
        icon={Grid3x3}
        sectionId="page-lines"
        reportId={reportId}
        defaultOpen={false}
        className="border-t border-neutral-100 pt-3"
      >
        <div className="space-y-1.5">
          {LINES_PRESETS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onApplyLinesPreset(option.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              <span className="block text-[13px] font-medium text-neutral-900">{option.label}</span>
              <span className="block text-[12px] text-neutral-500">{option.description}</span>
            </button>
          ))}
        </div>
        <PropertyHint>Aplica a toda a lista e aos textos de encerramento. Depois você ajusta cada parte nas propriedades da lista.</PropertyHint>
      </PropertyAccordion>
    </div>
  );
};
