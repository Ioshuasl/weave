import type { LineRect } from './bandLines';

export type BandFrameThickness = 'thin' | 'medium' | 'thick';

/**
 * Moldura da banda: borda em volta da banda e das bandas filhas dela presentes na folha, com cada lado ligável à parte.
 * Numa banda raiz de lista (ex.: o agrupador por dia) envolve todos os registros e os textos de encerramento da folha.
 */
export interface BandFrame {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
  /** Padrão: média (2 px) */
  thickness?: BandFrameThickness;
  /** `#rrggbb` — padrão preto */
  color?: string;
}

export const BAND_FRAME_EDGES = ['left', 'right', 'top', 'bottom'] as const;
export const BAND_FRAME_THICKNESS_PX: Record<BandFrameThickness, number> = { thin: 1, medium: 2, thick: 3 };
export const DEFAULT_BAND_FRAME_THICKNESS: BandFrameThickness = 'medium';

export const hasBandFrame = (frame?: BandFrame): boolean => Boolean(frame && BAND_FRAME_EDGES.some((edge) => frame[edge]));
export const getBandFrameThicknessPx = (frame?: BandFrame): number => BAND_FRAME_THICKNESS_PX[frame?.thickness ?? DEFAULT_BAND_FRAME_THICKNESS];
export const getBandFrameColor = (frame?: BandFrame): string => frame?.color ?? '#000000';

/** Lados ligados da moldura, desenhados DENTRO da caixa (a borda nunca vaza para fora da banda). */
export function computeFrameRects(box: { x: number; y: number; width: number; height: number }, frame: BandFrame): LineRect[] {
  const t = getBandFrameThicknessPx(frame);
  const rects: LineRect[] = [];
  if (frame.top) rects.push({ x: box.x, y: box.y, width: box.width, height: t });
  if (frame.bottom) rects.push({ x: box.x, y: box.y + box.height - t, width: box.width, height: t });
  if (frame.left) rects.push({ x: box.x, y: box.y, width: t, height: box.height });
  if (frame.right) rects.push({ x: box.x + box.width - t, y: box.y, width: t, height: box.height });
  return rects;
}
