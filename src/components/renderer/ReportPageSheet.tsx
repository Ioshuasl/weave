import React from 'react';
import type { ReportBand, ReportComponent, ReportPage } from '../../types/report';
import type { PreviewLayer } from '../../utils/previewLayout';
import { DividerLine } from '../designer/DividerLine';
import { resolveDividerLine } from '../../utils/vectorLineUtils';
import { DataBandTableView } from '../designer/DataBandTableView';
import { RenderedComponent } from './RenderedComponent';
import { getListRowContentInset } from '../../utils/dataBandUtils';
import { ListRowMarker } from '../designer/ListRowMarker';
import type { SystemVariables } from '../../utils/systemVariables';

interface ReportPageSheetProps {
  page: ReportPage;
  bands: Record<string, ReportBand>;
  components: Record<string, ReportComponent>;
  data: Record<string, unknown[]>;
  contentWidth: number;
  contentHeight: number;
  layers: PreviewLayer[];
  sysContext?: SystemVariables;
  className?: string;
}

export const ReportPageSheet: React.FC<ReportPageSheetProps> = ({
  page,
  bands,
  components,
  data,
  contentWidth,
  contentHeight,
  layers,
  sysContext,
  className,
}) => {
  const isFixedSheet = (page.profile ?? 'document') !== 'continuous';

  return (
    <div
      className={className}
      style={{
        width: page.width,
        height: isFixedSheet ? page.height : undefined,
        minHeight: page.height,
        padding: `${page.margins.top}px ${page.margins.right}px ${page.margins.bottom}px ${page.margins.left}px`,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
      }}
    >
      <div
        className="relative"
        style={{
          width: contentWidth,
          height: contentHeight,
          minHeight: contentHeight,
        }}
      >
        {layers.map((layer) => {
          const band = bands[layer.bandId];
          if (!band) return null;

          const boxStyle: React.CSSProperties = {
            position: 'absolute',
            left: layer.rect.x,
            top: layer.rect.y,
            width: layer.rect.width,
            height: layer.rect.height,
            zIndex: layer.zIndex,
            overflow: 'hidden',
            boxSizing: 'border-box',
          };

          if (layer.kind === 'divider') {
            const line = resolveDividerLine(band, layer.rect);
            return (
              <div key={layer.key} style={{ ...boxStyle, overflow: 'visible' }} aria-hidden>
                <DividerLine
                  line={line}
                  color={band.dividerColor}
                  thickness={band.dividerThickness}
                />
              </div>
            );
          }

          if (layer.kind === 'data-table' && band.dataSource) {
            const rows = (data[band.dataSource] ?? []) as Record<string, unknown>[];
            return (
              <div key={layer.key} style={boxStyle}>
                <DataBandTableView
                  band={band}
                  rows={rows}
                  dataSource={band.dataSource}
                />
              </div>
            );
          }

          if (layer.kind === 'data-row' && layer.row) {
            const contentInset = getListRowContentInset(band);

            return (
              <div key={layer.key} style={boxStyle}>
                <ListRowMarker band={band} rowIndex={layer.rowIndex ?? 0} />
                <div
                  className="absolute top-0 right-0 bottom-0 overflow-hidden"
                  style={{ left: contentInset }}
                >
                  {band.components.map((compId) => (
                    <RenderedComponent
                      key={`${compId}-${layer.rowIndex}`}
                      componentId={compId}
                      dataContext={layer.row}
                      sysContext={sysContext}
                    />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={layer.key} style={boxStyle}>
              {band.components.map((compId) => (
                <RenderedComponent
                  key={compId}
                  componentId={compId}
                  sysContext={sysContext}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
