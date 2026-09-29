import React from 'react';
import { ClipboardPaste, Copy, Layout, Trash2 } from 'lucide-react';
import { type ReportBand, getBandRect, isDataBand } from '../../../../band/domain';
import type { ReportPage } from '../../../../page/domain';
import type { DataSourceCatalog } from '../../../../data-source/domain';
import { cn } from '../../../../../shared/ui/cn';
import { normalizeDividerAngle } from '../../../../band/ui';
import { DataBandPropertiesSection } from './DataBandPropertiesSection';
import {
  PropertyAngleInput,
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
} from '../controls/PropertyFields';
import { PropertyAccordion } from '../controls/PropertyAccordion';

const DIVIDER_ANGLE_PRESETS = [
  { label: 'Horizontal', angle: 0 },
  { label: 'Vertical', angle: 90 },
  { label: 'Diagonal ↘', angle: 45 },
  { label: 'Diagonal ↙', angle: 135 },
] as const;

export function BandProperties({
  band,
  bandId,
  page,
  data,
  dataSourceCatalog,
  reportId,
  updateBand,
  canPaste,
  onPaste,
  onDuplicate,
  onRemove,
}: {
  band: ReportBand;
  bandId: string;
  page: ReportPage;
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  reportId: string;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
  canPaste: boolean;
  onPaste: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const isDividerBand = band.type === 'divider';
  const bandRect = getBandRect(band, page);

  const updateBandRect = (
    patch: Partial<{ x: number; y: number; width: number; height: number }>
  ) => {
    const next = { ...bandRect, ...patch };
    updateBand(bandId, {
      bandRect: next,
      ...(isDividerBand ? { dividerRect: next } : {}),
    });
  };

  return (
    <>
      <PropertyAccordion
        title="Layout"
        icon={Layout}
        sectionId="band-layout"
        reportId={reportId}
        defaultOpen
      >
        <PropertyFieldGrid>
          <PropertyNumberInput
            label="X"
            suffix="px"
            value={Math.round(bandRect.x)}
            onChange={(x) => updateBandRect({ x })}
          />
          <PropertyNumberInput
            label="Y"
            suffix="px"
            value={Math.round(bandRect.y)}
            onChange={(y) => updateBandRect({ y })}
          />
          {!isDividerBand && (
            <>
              <PropertyNumberInput
                label="Largura"
                suffix="px"
                min={60}
                value={Math.round(bandRect.width)}
                onChange={(width) => updateBandRect({ width })}
              />
              <PropertyNumberInput
                label="Altura"
                suffix="px"
                min={20}
                value={Math.round(bandRect.height)}
                onChange={(height) => updateBandRect({ height })}
              />
            </>
          )}
        </PropertyFieldGrid>
        <PropertyHint>
          {isDividerBand
            ? 'Arraste no canvas ou ajuste X/Y. O tamanho acompanha a linha automaticamente.'
            : 'Arraste no canvas para posicionar. Ao selecionar, a banda vai para a frente.'}
        </PropertyHint>

        {isDataBand(band.type) && (
          <DataBandPropertiesSection
            band={band}
            bandId={bandId}
            data={data}
            dataSourceCatalog={dataSourceCatalog}
            updateBand={updateBand}
          />
        )}

        {isDividerBand && (
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            <div>
              <span className="block text-[11px] font-medium text-neutral-600 mb-1.5">
                Orientação rápida
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {DIVIDER_ANGLE_PRESETS.map((preset) => {
                  const currentAngle = normalizeDividerAngle(band.dividerAngle ?? 0);
                  const isActive = currentAngle === preset.angle;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateBand(bandId, { dividerAngle: preset.angle })}
                      className={cn(
                        'px-2 py-2 text-[11px] font-medium rounded-md border transition-colors',
                        isActive
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <PropertyAngleInput
              label="Ângulo"
              value={normalizeDividerAngle(band.dividerAngle ?? 0)}
              onChange={(angle) =>
                updateBand(bandId, { dividerAngle: normalizeDividerAngle(angle) })
              }
              hint="Arraste as extremidades ou o ponto lateral no canvas. Shift = snap 45°."
            />

            <PropertyFieldGrid>
              <PropertyNumberInput
                label="Espessura"
                suffix="px"
                min={1}
                max={20}
                value={band.dividerThickness ?? 1}
                onChange={(dividerThickness) => updateBand(bandId, { dividerThickness })}
              />
            </PropertyFieldGrid>

            <PropertyColorInput
              label="Cor da linha"
              value={band.dividerColor ?? '#a3a3a3'}
              onChange={(dividerColor) => updateBand(bandId, { dividerColor })}
            />
          </div>
        )}
      </PropertyAccordion>

      <div className="pt-4 border-t border-neutral-100 space-y-2">
        {canPaste && (
          <button
            type="button"
            onClick={onPaste}
            className="w-full flex items-center justify-center gap-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-md text-[13px] transition-colors border border-neutral-200"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Colar componente (Ctrl+V)
          </button>
        )}
        <button
          type="button"
          onClick={onDuplicate}
          className="w-full flex items-center justify-center gap-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-md text-[13px] transition-colors border border-neutral-200"
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicar banda
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-1.5 hover:bg-red-50 text-neutral-500 hover:text-red-600 px-3 py-2 rounded-md text-[13px] transition-colors border border-transparent hover:border-red-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir banda
        </button>
      </div>
    </>
  );
}
