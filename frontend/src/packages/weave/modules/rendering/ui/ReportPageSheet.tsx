import React from 'react';
import { cn } from '../../../shared/ui/cn';
import { type ReportBand, resolveDividerLine, getListRowContentInset, computeBandLineRects, computeFillPageLineRects } from '../../band/domain';
import { BandLinesOverlay, DividerLine, DataBandTableView, ListRowMarker } from '../../band/ui';
import { RenderedComponent } from './RenderedComponent';
import type { ReportComponent } from '../../components/common/domain';
import type { SystemVariables } from '../../expression/domain';
import type { ReportPage } from '../../page/domain';
import type { PreviewLayer } from '../domain/previewTypes';
import { computeBandFrames } from '../domain/bandFrames';
import { computeRegistroSides } from '../domain/registroLines';

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
  const lineCtx = { bands, components };
  // Laterais de registros com várias bandas (pai + filhas): uma só linha em cada ponta do registro inteiro
  const registro = computeRegistroSides(layers, bands);
  const topZ = layers.reduce((max, l) => Math.max(max, l.zIndex), 0) + 1;
  // Moldura da banda (e das filhas): caixa única por banda, só com os lados ligados
  const frames = computeBandFrames(layers, bands);

  // Linhas das colunas continuam nos espaços vazios: do fim da última banda do corpo até o topo do rodapé.
  const footerTop = layers.reduce((min, l) => (bands[l.bandId]?.type === 'pageFooter' ? Math.min(min, l.rect.y) : min), contentHeight);
  const fillFromY = layers.reduce((max, l) => (bands[l.bandId]?.type === 'pageFooter' ? max : Math.max(max, l.rect.y + l.rect.height)), 0);
  const fillGroups = isFixedSheet
    ? [...new Set(layers.map((l) => l.bandId))].flatMap((bandId) => {
        const band = bands[bandId];
        const last = [...layers].reverse().find((l) => l.bandId === bandId);
        if (!band?.lines?.fillPage || !last) return [];
        const fill = computeFillPageLineRects(band, components, last.rect, getListRowContentInset(band), fillFromY, footerTop);
        // o preenchimento até o fim da folha também segue as pontas do registro inteiro
        const extent = registro.extentByBand.get(bandId);
        if (fill && extent && band.lines?.sides && fill.rects.length >= 2) {
          const t = fill.rects[0].width;
          fill.rects[0] = { ...fill.rects[0], x: extent.x };
          fill.rects[1] = { ...fill.rects[1], x: extent.x + extent.width - t };
        }
        return fill ? [fill] : [];
      })
    : [];

  return (
    <div
      className={cn('weave-paper', className)}
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
        style={{
          position: 'relative',
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
            // as laterais deste registro já são desenhadas pelo registro inteiro
            const lineBand = registro.suppressSides.has(layer.key) && band.lines?.sides ? { ...band, lines: { ...band.lines, sides: false } } : band;

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
                      component={components[compId]}
                      globalData={data}
                      dataContext={layer.row}
                      sysContext={sysContext}
                      rowHeight={band.autoHeight ? layer.rect.height : undefined}
                    />
                  ))}
                </div>
                <BandLinesOverlay groups={computeBandLineRects(lineBand, lineCtx, { width: layer.rect.width, height: layer.rect.height }, contentInset)} />
              </div>
            );
          }

          return (
            <div key={layer.key} style={boxStyle}>
              {band.components.map((compId) => (
                <RenderedComponent
                  key={compId}
                  component={components[compId]}
                  globalData={data}
                  sysContext={sysContext}
                />
              ))}
              <BandLinesOverlay groups={computeBandLineRects(band, lineCtx, { width: layer.rect.width, height: layer.rect.height })} />
            </div>
          );
        })}
        {registro.groups.length > 0 && (
          <div className="pointer-events-none absolute inset-0" style={{ zIndex: topZ }}>
            <BandLinesOverlay groups={registro.groups} />
          </div>
        )}
        {fillGroups.length > 0 && <BandLinesOverlay groups={fillGroups} />}
        {frames.length > 0 && (
          <div className="pointer-events-none absolute inset-0" style={{ zIndex: topZ + 1 }}>
            <BandLinesOverlay groups={frames} />
          </div>
        )}
      </div>
    </div>
  );
};
