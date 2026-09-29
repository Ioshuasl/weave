import { type ReportBand, getBandOutputScope } from '../../band/domain';
import type { ReportPage } from '../../page/domain';
import type { PreviewLayer } from './previewTypes';
import type { PageLayoutZones } from './previewTypes';

export function resolvePageLayoutZones(
  page: ReportPage,
  bands: Record<string, ReportBand>,
  everyPageLayers: PreviewLayer[],
  contentHeight: number
): PageLayoutZones {
  const headerBottom = everyPageLayers
    .filter((layer) => bands[layer.bandId]?.type === 'pageHeader')
    .reduce((max, layer) => Math.max(max, layer.rect.y + layer.rect.height), 0);

  const footerTop = everyPageLayers
    .filter((layer) => bands[layer.bandId]?.type === 'pageFooter')
    .reduce((min, layer) => Math.min(min, layer.rect.y), contentHeight);

  const bodyTop = headerBottom;
  const bodyBottom = footerTop > bodyTop ? footerTop : contentHeight;

  return {
    contentHeight,
    headerBottom,
    footerTop,
    bodyTop,
    bodyBottom,
  };
}

export function tagLayerScope(
  layer: PreviewLayer,
  bands: Record<string, ReportBand>
): PreviewLayer {
  const band = bands[layer.bandId];
  if (!band) return layer;
  return { ...layer, scope: getBandOutputScope(band.type) };
}
