import type { ReportBand } from './band';
import { type ReportPage, getPageContentSize } from '../../page/domain';
import type { Rect } from '../../../shared/domain/geometry';

/** Retângulo da banda na área útil da página */
export function getBandRect(band: ReportBand, page: ReportPage): Rect {
  if (band.type === 'divider' && band.dividerRect) return band.dividerRect;
  if (band.bandRect) return band.bandRect;

  const { width } = getPageContentSize(page);
  return {
    x: 8,
    y: 8,
    width: Math.max(80, width - 16),
    height: band.height || 40,
  };
}

export function getDefaultBandRect(
  page: ReportPage,
  height: number,
  stackIndex: number
): Rect {
  const { width } = getPageContentSize(page);
  const cascade = (stackIndex % 12) * 14;
  return {
    x: 16 + cascade,
    y: 16 + cascade,
    width: Math.max(120, width - 32 - cascade),
    height,
  };
}

/** Ordem de empilhamento (índice baixo = atrás, alto = na frente) */
export function getAllPlacedBandIds(
  page: ReportPage,
  bands: Record<string, ReportBand>
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const id of page.bands) {
    if (bands[id] && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  for (const id of page.dividers ?? []) {
    if (bands[id] && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  return ordered;
}

export function getBandZIndex(
  bandId: string,
  page: ReportPage,
  selectedId: string | null
): number {
  const bandIndex = page.bands.indexOf(bandId);
  const dividerIndex = (page.dividers ?? []).indexOf(bandId);
  const stackIndex = bandIndex >= 0 ? bandIndex : dividerIndex;
  const order = stackIndex >= 0 ? stackIndex : 0;
  const isActive = selectedId === bandId;
  return isActive ? 100 + order : 10 + order;
}

/** @deprecated use getBandRect */
export function getDividerRect(band: ReportBand, page: ReportPage): Rect {
  return getBandRect(band, page);
}

export function getDefaultDividerRect(page: ReportPage): Rect {
  const { width, height } = getPageContentSize(page);
  return {
    x: Math.round(width * 0.08),
    y: Math.round(height * 0.35),
    width: Math.round(width * 0.84),
    height: 24,
  };
}
