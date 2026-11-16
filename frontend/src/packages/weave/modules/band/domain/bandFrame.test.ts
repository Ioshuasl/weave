import { describe, expect, it } from 'vitest';
import { computeFrameRects, getBandFrameColor, getBandFrameThicknessPx, hasBandFrame } from './bandFrame';

describe('moldura da banda (BandFrame)', () => {
  const box = { x: 10, y: 20, width: 100, height: 50 };

  it('só os lados ligados são desenhados, dentro da caixa', () => {
    expect(computeFrameRects(box, { left: true })).toEqual([{ x: 10, y: 20, width: 2, height: 50 }]);
    expect(computeFrameRects(box, { right: true })).toEqual([{ x: 108, y: 20, width: 2, height: 50 }]);
    expect(computeFrameRects(box, { top: true })).toEqual([{ x: 10, y: 20, width: 100, height: 2 }]);
    expect(computeFrameRects(box, { bottom: true })).toEqual([{ x: 10, y: 68, width: 100, height: 2 }]);
  });

  it('os 4 lados fecham a caixa e nenhum retângulo passa da caixa', () => {
    const rects = computeFrameRects(box, { left: true, right: true, top: true, bottom: true, thickness: 'thick' });
    expect(rects).toHaveLength(4);
    rects.forEach((r) => {
      expect(r.x).toBeGreaterThanOrEqual(10);
      expect(r.y).toBeGreaterThanOrEqual(20);
      expect(r.x + r.width).toBeLessThanOrEqual(110);
      expect(r.y + r.height).toBeLessThanOrEqual(70);
      expect(Math.min(r.width, r.height)).toBe(3);
    });
  });

  it('espessura: fina 1 px, média 2 px (padrão), grossa 3 px', () => {
    expect(getBandFrameThicknessPx({ thickness: 'thin' })).toBe(1);
    expect(getBandFrameThicknessPx({})).toBe(2);
    expect(getBandFrameThicknessPx(undefined)).toBe(2);
    expect(getBandFrameThicknessPx({ thickness: 'thick' })).toBe(3);
  });

  it('cor padrão preta; hasBandFrame só é verdadeiro com algum lado ligado', () => {
    expect(getBandFrameColor({})).toBe('#000000');
    expect(getBandFrameColor({ color: '#ff0000' })).toBe('#ff0000');
    expect(hasBandFrame(undefined)).toBe(false);
    expect(hasBandFrame({ thickness: 'thick', color: '#fff' })).toBe(false);
    expect(hasBandFrame({ bottom: true })).toBe(true);
  });
});
