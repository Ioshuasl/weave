import React from 'react';
import type { ReportBand } from '../../types/report';
import { getListRowMarkerKind } from '../../utils/dataBandUtils';
import { DataBandRowBullet } from './DataBandRowBullet';
import { DataBandRowNumber } from './DataBandRowNumber';

interface ListRowMarkerProps {
  band: ReportBand;
  rowIndex?: number;
  className?: string;
}

/** Coluna de marcador (número ou bullet) em uma linha de lista */
export function ListRowMarker({ band, rowIndex = 0, className }: ListRowMarkerProps) {
  const kind = getListRowMarkerKind(band);

  if (kind === 'number') {
    return (
      <DataBandRowNumber
        rowIndex={rowIndex}
        config={band.numberedList}
        className={className}
      />
    );
  }

  if (kind === 'bullet') {
    return <DataBandRowBullet config={band.bulletList} className={className} />;
  }

  return null;
}
