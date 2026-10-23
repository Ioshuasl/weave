import { MapPin } from 'lucide-react';
import React from 'react';
import { getReportPage } from '../../../../report/domain';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';
import { getRepeatingElementBandType } from '../../../domain/elementBands';
import { PropertyHint, PropertySelect } from '../controls/PropertyFields';
import type { BandType, ReportBand } from '../../../../band/domain';

type Placement = 'firstPage' | 'everyPage' | 'end';

const OPTIONS: { value: Placement; label: string }[] = [
  { value: 'firstPage', label: 'Só na 1ª folha' },
  { value: 'everyPage', label: 'Em todas as folhas' },
  { value: 'end', label: 'No fim do relatório (depois das listas)' },
];

const HINTS: Record<Placement, string> = {
  firstPage:
    'Fica exatamente aqui, só na primeira folha. Se ficar abaixo de uma lista, a lista pode crescer por cima dele — nesse caso use "No fim do relatório".',
  everyPage:
    'Repete em todas as folhas nesta posição. No alto da folha, as listas começam abaixo dele; na parte de baixo, terminam acima dele.',
  end: 'Aparece uma vez, logo depois de todas as listas (bom para totais, assinatura e encerramento).',
};

function placementOf(type: BandType): Placement {
  if (type === 'pageHeader' || type === 'pageFooter') return 'everyPage';
  if (type === 'reportSummary') return 'end';
  return 'firstPage';
}

/** "Onde aparece" de um elemento solto — troca o tipo da banda invisível que o envolve. */
export function ElementPlacementSection({ band }: { band: ReportBand }) {
  const updateBand = useDesignerStore((state) => state.updateBand);
  const report = useDesignerStore((state) => state.report);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const page = getReportPage(report, activePageId);
  const placement = placementOf(band.type);

  const handleChange = (next: Placement) => {
    const type: BandType =
      next === 'end'
        ? 'reportSummary'
        : next === 'everyPage' && page && band.bandRect
          ? getRepeatingElementBandType(band.bandRect, page)
          : 'reportTitle';
    updateBand(band.id, { type });
  };

  return (
    <div className="space-y-1.5 rounded-md border border-neutral-200 bg-neutral-50/60 p-3">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
        <MapPin className="h-3 w-3" />
        Onde aparece
      </span>
      <PropertySelect
        label="Mostrar este elemento"
        value={placement}
        onChange={handleChange}
        options={OPTIONS}
      />
      <PropertyHint>{HINTS[placement]}</PropertyHint>
    </div>
  );
}
