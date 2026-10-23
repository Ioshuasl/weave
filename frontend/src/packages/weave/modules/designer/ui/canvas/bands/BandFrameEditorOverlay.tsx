import React, { useMemo } from 'react';
import { computeFrameRects, getBandFrameColor, hasBandFrame } from '../../../../band/domain';
import { BandLinesOverlay } from '../../../../band/ui';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';

/** Moldura da banda no editor: só a caixa da própria banda (a folha desenha a das filhas junto, ao paginar). */
export const BandFrameEditorOverlay = React.memo(function BandFrameEditorOverlay({ bandId, width, height }: { bandId: string; width: number; height: number }) {
  const frame = useDesignerStore((state) => state.report.bands[bandId]?.frame);
  const groups = useMemo(() => (frame && hasBandFrame(frame) ? [{ color: getBandFrameColor(frame), rects: computeFrameRects({ x: 0, y: 0, width, height }, frame) }] : []), [frame, width, height]);
  return <BandLinesOverlay groups={groups} />;
});
