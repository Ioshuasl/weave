import React, { useMemo } from 'react';
import { FileText, RotateCw } from 'lucide-react';
import {
  type PageSizeUnit,
  type ReportPage,
  cmToPx,
  CUSTOM_PAGE_PRESET_ID,
  getOrientationPairPresetId,
  pxToCm,
  type PagePresetGroup,
} from '../../../../page/domain';
import { usePagePresetCatalog } from '../../../../page/ui';
import {
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
} from '../controls/PropertyFields';
import { PropertyAccordion } from '../controls/PropertyAccordion';

interface PagePropertiesSectionProps {
  page: ReportPage;
  reportId?: string;
  onApplyPreset: (presetId: string) => void;
  onFlipOrientation: () => void;
  onUpdatePage: (
    updates: Partial<ReportPage>,
    options?: { scaleContent?: boolean }
  ) => void;
}

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
      <PropertyHint>
        Troque, renomeie, duplique ou exclua páginas pelas <strong>abas acima do canvas</strong>.
      </PropertyHint>

      <PropertyAccordion
        title="Tamanho da folha"
        icon={FileText}
        sectionId="page-size"
        reportId={reportId}
        defaultOpen
      >
        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">Preset</label>
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
            className="w-full min-w-0 text-[13px] text-neutral-900 bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 hover:border-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/8"
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
            {page.width}×{page.height} px · perfil {page.profile ?? 'document'}
          </PropertyHint>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onFlipOrientation}
            disabled={!canFlip && isCustom}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
            title="Alternar retrato / paisagem"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Orientação
          </button>
        </div>

        <PropertySegmentedControl
          label="Unidade"
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
            Selecione <strong>Personalizado</strong> para editar largura e altura manualmente.
          </PropertyHint>
        )}
      </PropertyAccordion>

      <PropertyAccordion
        title="Margens"
        sectionId="page-margins"
        reportId={reportId}
        defaultOpen
        className="pt-2 border-t border-neutral-100"
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
        <PropertyHint>Guias tracejadas no canvas mostram a área útil.</PropertyHint>
      </PropertyAccordion>
    </div>
  );
};
