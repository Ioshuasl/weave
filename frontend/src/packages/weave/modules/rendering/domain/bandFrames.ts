import { computeFrameRects, getBandFrameColor, hasBandFrame, type LineRect, type ReportBand } from '../../band/domain';
import type { PreviewLayer } from './previewTypes';

/** Ids da banda e de todas as filhas (qualquer posição: antes, ao lado, depois), em qualquer nível. */
function bandFamily(bandId: string, bands: Record<string, ReportBand>): Set<string> {
  const family = new Set([bandId]);
  const stack = [bandId];
  while (stack.length) {
    const parent = stack.pop();
    for (const band of Object.values(bands)) {
      if (band.link?.parentBandId === parent && !family.has(band.id)) {
        family.add(band.id);
        stack.push(band.id);
      }
    }
  }
  return family;
}

/**
 * Moldura de cada banda que a tem: a caixa que junta as camadas da banda e das filhas NESTA folha
 * (primeira ao topo, última ao fim, da ponta esquerda à direita), com só os lados ligados desenhados.
 * Coordenadas da folha. Banda sem camada na folha não desenha nada.
 */
export function computeBandFrames(layers: PreviewLayer[], bands: Record<string, ReportBand>): { color: string; rects: LineRect[] }[] {
  const out: { color: string; rects: LineRect[] }[] = [];
  for (const band of Object.values(bands)) {
    if (!hasBandFrame(band.frame) || !band.frame) continue;
    const family = bandFamily(band.id, bands);
    const members = layers.filter((layer) => family.has(layer.bandId));
    if (!members.length) continue;
    const x0 = Math.min(...members.map((l) => l.rect.x));
    const x1 = Math.max(...members.map((l) => l.rect.x + l.rect.width));
    const y0 = Math.min(...members.map((l) => l.rect.y));
    const y1 = Math.max(...members.map((l) => l.rect.y + l.rect.height));
    out.push({ color: getBandFrameColor(band.frame), rects: computeFrameRects({ x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, band.frame) });
  }
  return out;
}
