import React from 'react';
import { type ReportBand, getListRowContentInset } from '../../../../band/domain';
import { stylePreviewDebug } from '../../../infrastructure/stylePreviewDebug';
import { ListRowMarker } from '../../../../band/ui';
import { ComponentRenderer } from '../components/ComponentRenderer';

interface DataBandListPreviewProps {
  band: ReportBand;
  rowHeight: number;
}

/** Uma linha-molde editável no canvas. Dados reais só no modo Visualizar. */
export const DataBandListPreview = React.memo(function DataBandListPreview({
  band,
  rowHeight,
}: DataBandListPreviewProps) {
  const contentInset = getListRowContentInset(band);

  stylePreviewDebug.countRender(`DataBandListPreview:${band.id}`);

  return (
    <div className="relative w-full h-full" style={{ minHeight: rowHeight }}>
      <ListRowMarker band={band} rowIndex={0} />
      <div
        className="band-components-layer absolute top-0 right-0 bottom-0 isolate hide-scrollbar"
        style={{ left: contentInset }}
      >
        {band.components.map((compId) => (
          <ComponentRenderer key={compId} componentId={compId} />
        ))}
      </div>
    </div>
  );
});
