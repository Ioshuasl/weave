import { Database, Grid3x3, Move, Paintbrush, Square } from 'lucide-react';
import React from 'react';
import { cn } from '../../../../../shared/ui/cn';
import { type ReportBand, getBandRect, isDataBand, isLinesBand } from '../../../../band/domain';
import { normalizeDividerAngle } from '../../../../band/ui';
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { PropertyActionBar } from '../controls/PropertyActionBar';
import {
  PropertyAngleInput,
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
} from '../controls/PropertyFields';
import { PropertyTabs, type PropertyTabItem } from '../controls/PropertyTabs';
import { BandFrameSection } from './BandFrameSection';
import { BandLinesSection } from './BandLinesSection';
import { DataBandPropertiesSection } from './DataBandPropertiesSection';
import type { DataSourceCatalog } from '../../../../data-source/domain';
import type { ReportPage } from '../../../../page/domain';

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
    patch: Partial<{ x: number; y: number; width: number; height: number }>,
  ) => {
    const next = { ...bandRect, ...patch };
    updateBand(bandId, {
      bandRect: next,
      ...(isDividerBand ? { dividerRect: next } : {}),
    });
  };

  const rectContent = (
    <>
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
    </>
  );

  const dividerContent = isDividerBand && (
    <div className="space-y-4">
      <div>
        <span className="mb-1.5 block text-[12px] font-medium text-neutral-600">
          Direção da linha
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
                  'rounded-lg px-2 py-2 text-[12px] font-medium transition-colors',
                  isActive ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70',
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
        onChange={(angle) => updateBand(bandId, { dividerAngle: normalizeDividerAngle(angle) })}
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
  );

  const tabs: PropertyTabItem[] = [];
  if (dividerContent) {
    tabs.push({ id: 'style', label: 'Estilo', icon: Paintbrush, content: dividerContent });
  }
  if (isDataBand(band.type)) {
    tabs.push({
      id: 'content',
      label: 'Conteúdo',
      icon: Database,
      content: (
        <DataBandPropertiesSection
          band={band}
          key={bandId}
          bandId={bandId}
          reportId={reportId}
          data={data}
          dataSourceCatalog={dataSourceCatalog}
          updateBand={updateBand}
        />
      ),
    });
  }

  return (
    <>
      {tabs.length > 0 && <PropertyTabs tabs={tabs} />}

      {isLinesBand(band) && (
        <PropertyAccordion
          title="Linhas da lista"
          icon={Grid3x3}
          sectionId="band-lines"
          reportId={reportId}
          defaultOpen
          className="border-t border-neutral-100 pt-2"
        >
          <BandLinesSection band={band} bandId={bandId} updateBand={updateBand} />
        </PropertyAccordion>
      )}

      {band.type !== 'divider' && (
        <PropertyAccordion
          title="Moldura da banda"
          icon={Square}
          sectionId="band-frame"
          reportId={reportId}
          defaultOpen={false}
          className="border-t border-neutral-100 pt-2"
        >
          <BandFrameSection band={band} bandId={bandId} updateBand={updateBand} />
        </PropertyAccordion>
      )}

      <PropertyAccordion
        title="Posição e tamanho"
        icon={Move}
        sectionId="advanced-band-rect"
        reportId={reportId}
        defaultOpen={false}
        className={cn(tabs.length > 0 && 'border-t border-neutral-100 pt-2')}
      >
        {rectContent}
      </PropertyAccordion>

      <PropertyActionBar canPaste={canPaste} onPaste={onPaste} onDuplicate={onDuplicate} onRemove={onRemove} />
    </>
  );
}
