import React from 'react';
import type { ReportBand } from '../../types/report';
import {
  DESIGNER_LIST_GHOST_ROW_LIMIT,
  getDesignerListPreviewRowCount,
  getListRowContentInset,
} from '../../utils/dataBandUtils';
import { cn } from '../../utils/cn';
import { useDesignerStore } from '../../store/designerStore';
import { stylePreviewDebug } from '../../utils/stylePreviewDebug';
import { ListRowMarker } from './ListRowMarker';
import { ComponentRenderer } from './ComponentRenderer';
import { RenderedComponent } from '../renderer/RenderedComponent';

interface DataBandListPreviewProps {
  band: ReportBand;
  rows: Record<string, unknown>[];
  rowHeight: number;
}

/**
 * Exibe até 3 linhas no canvas: a primeira é editável;
 * as demais são fantasma (dados reais, somente leitura).
 */
export const DataBandListPreview = React.memo(function DataBandListPreview({
  band,
  rows,
  rowHeight,
}: DataBandListPreviewProps) {
  const livePreviewComponentId = useDesignerStore(
    (state) => state.liveStylePreview?.componentId ?? null
  );
  const draggingComponentId = useDesignerStore((state) => state.draggingComponentId);
  const contentInset = getListRowContentInset(band);
  const previewCount = getDesignerListPreviewRowCount(rows.length, band.components.length > 0);
  const hasMore = rows.length > DESIGNER_LIST_GHOST_ROW_LIMIT;
  const footerHeight = hasMore ? 14 : 0;
  const suspendGhosts =
    (livePreviewComponentId != null && band.components.includes(livePreviewComponentId)) ||
    (draggingComponentId != null && band.components.includes(draggingComponentId));
  const visibleRowCount = suspendGhosts ? 1 : previewCount;

  stylePreviewDebug.countRender(`DataBandListPreview:${band.id}`);
  if (suspendGhosts) {
    stylePreviewDebug.log('fantasmas suspensos', {
      bandId: band.id,
      livePreviewComponentId,
      draggingComponentId,
    });
  }

  return (
    <div
      className="relative w-full"
      style={{ height: rowHeight * visibleRowCount + (suspendGhosts ? 0 : footerHeight) }}
    >
      {Array.from({ length: visibleRowCount }, (_, rowIndex) => {
        const row = rows[rowIndex];
        const isGhost = rowIndex > 0;

        return (
          <div
            key={rowIndex}
            className={cn('absolute left-0 right-0', isGhost && 'pointer-events-none')}
            style={{ top: rowIndex * rowHeight, height: rowHeight }}
            aria-hidden={isGhost || undefined}
          >
            {isGhost && (
              <div
                className="absolute inset-0 bg-neutral-50/60 border-t border-dashed border-neutral-300/80"
                aria-hidden
              />
            )}
            <ListRowMarker
              band={band}
              rowIndex={rowIndex}
              className={isGhost ? 'opacity-60' : undefined}
            />
            <div
              className={cn(
                'band-components-layer absolute top-0 right-0 bottom-0 isolate hide-scrollbar',
                isGhost && 'opacity-55'
              )}
              style={{ left: contentInset }}
            >
              {rowIndex === 0
                ? band.components.map((compId) => (
                    <ComponentRenderer key={compId} componentId={compId} />
                  ))
                : band.components.map((compId) => (
                    <RenderedComponent
                      key={`${compId}-ghost-${rowIndex}`}
                      componentId={compId}
                      dataContext={row}
                    />
                  ))}
            </div>
          </div>
        );
      })}

      {hasMore && !suspendGhosts && (
        <p
          className="absolute left-0 right-0 text-center text-[10px] text-neutral-400 pointer-events-none"
          style={{ top: rowHeight * visibleRowCount }}
        >
          +{rows.length - DESIGNER_LIST_GHOST_ROW_LIMIT} linhas na pré-visualização
        </p>
      )}
    </div>
  );
});
