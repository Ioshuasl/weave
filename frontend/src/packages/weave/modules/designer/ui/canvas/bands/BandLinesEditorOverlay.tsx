import React, { useMemo } from 'react';
import { computeBandLineRects, getListRowContentInset } from '../../../../band/domain';
import { BandLinesOverlay } from '../../../../band/ui';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';

/** Linhas de divisão da banda dentro do editor (a linha-molde mostra como cada registro vai ficar). */
export const BandLinesEditorOverlay = React.memo(function BandLinesEditorOverlay({
  bandId,
  width,
  height,
}: {
  bandId: string;
  width: number;
  height: number;
}) {
  const bands = useDesignerStore((state) => state.report.bands);
  const components = useDesignerStore((state) => state.report.components);
  const groups = useMemo(() => {
    const band = bands[bandId];
    if (!band) return [];
    return computeBandLineRects(band, { bands, components }, { width, height }, getListRowContentInset(band));
  }, [bands, components, bandId, width, height]);
  return <BandLinesOverlay groups={groups} />;
});
