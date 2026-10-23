import React from 'react';
import {
  type BandLines,
  type BandLinesChoice,
  type ReportBand,
  buildBandLinesFromChoice,
  getBandLinesChoice,
  isColumnsBand,
} from '../../../../band/domain';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';
import { PropertyCheckbox, PropertyColorInput, PropertyHint, PropertySegmentedControl } from '../controls/PropertyFields';

const COLUMN_CHOICES: { value: BandLinesChoice; label: string }[] = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'rows', label: 'Entre registros' },
  { value: 'grid', label: 'Grade completa' },
];
const SINGLE_CHOICES: { value: BandLinesChoice; label: string }[] = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'rows', label: 'Embaixo' },
  { value: 'outline', label: 'Contorno' },
];

/** "Linhas da lista": escolhas simples em vez de bordas por componente. */
export function BandLinesSection({
  band,
  bandId,
  updateBand,
}: {
  band: ReportBand;
  bandId: string;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
}) {
  const components = useDesignerStore((state) => state.report.components);
  const hasColumns = isColumnsBand(band, components);
  const choice = getBandLinesChoice(band.lines);
  const lines = band.lines;
  const patch = (next: Partial<BandLines>) => updateBand(bandId, { lines: { ...lines, ...next } });

  return (
    <div className="space-y-3">
      <PropertySegmentedControl
        label="Linhas"
        value={choice}
        onChange={(value) => updateBand(bandId, { lines: buildBandLinesFromChoice(value, lines) })}
        options={hasColumns ? COLUMN_CHOICES : SINGLE_CHOICES}
      />
      <PropertyHint>
        {hasColumns
          ? '"Grade completa" separa os registros e as colunas com linhas, como nos livros de cartório.'
          : 'Linha embaixo do texto ou uma caixa ao redor dele.'}
      </PropertyHint>
      {choice !== 'none' && (
        <>
          <PropertySegmentedControl
            label="Espessura"
            value={lines?.thickness ?? 'thin'}
            onChange={(thickness) => patch({ thickness })}
            options={[
              { value: 'thin', label: 'Fina' },
              { value: 'medium', label: 'Média' },
            ]}
          />
          <PropertyColorInput label="Cor das linhas" value={lines?.color ?? '#000000'} onChange={(color) => patch({ color })} />
          {hasColumns && (
            <>
              <PropertyCheckbox label="Também no título das colunas" checked={lines?.header ?? false} onChange={(header) => patch({ header })} />
              {choice === 'grid' && (
                <PropertyCheckbox
                  label="Continuar até o fim da folha"
                  checked={lines?.fillPage ?? false}
                  onChange={(fillPage) => patch({ fillPage })}
                  hint="Preenche o espaço vazio de baixo com as linhas das colunas."
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
