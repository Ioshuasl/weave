import { describe, expect, it } from 'vitest';
import type { ReportBand } from '../../band/domain';
import { computeBandFrames } from './bandFrames';
import type { PreviewLayer } from './previewTypes';

const band = (id: string, extra: Partial<ReportBand> = {}) => ({ id, type: 'detailData', name: id, height: 10, components: [], ...extra }) as unknown as ReportBand;
const layer = (key: string, bandId: string, x: number, y: number, width: number, height: number): PreviewLayer => ({ key, bandId, rect: { x, y, width, height }, zIndex: 1, kind: 'data-row' });

/** raiz (agrupador, altura 0) → registro (antes) → pessoas (ao lado) / lavratura (abaixo); fechamento (abaixo da raiz); cabeçalho solto */
const bands: Record<string, ReportBand> = {
  cab: band('cab', { type: 'pageHeader' }),
  dia: band('dia', { type: 'masterData' }),
  prot: band('prot', { link: { parentBandId: 'dia', placement: 'above' } }),
  pess: band('pess', { link: { parentBandId: 'prot', placement: 'beside' } }),
  lav: band('lav', { link: { parentBandId: 'prot', placement: 'below' } }),
  fech: band('fech', { link: { parentBandId: 'dia', placement: 'below' } }),
  outra: band('outra'),
};
const layers: PreviewLayer[] = [
  layer('cab', 'cab', 0, 0, 1000, 175),
  layer('p1', 'prot', 0, 180, 500, 16), layer('q1', 'pess', 524, 180, 476, 16), layer('l1', 'lav', 0, 196, 1000, 34),
  layer('p2', 'prot', 0, 230, 500, 16), layer('q2', 'pess', 524, 230, 476, 32), layer('l2', 'lav', 0, 262, 1000, 34),
  layer('d', 'dia', 0, 296, 1000, 0), layer('f', 'fech', 0, 296, 1000, 34),
  layer('o', 'outra', 0, 400, 1000, 20),
];

describe('computeBandFrames', () => {
  it('banda raiz: moldura em volta de TODAS as camadas dela e das filhas (qualquer posição e nível), não do cabeçalho', () => {
    const [frame] = computeBandFrames(layers, { ...bands, dia: band('dia', { type: 'masterData', frame: { left: true, right: true, bottom: true, thickness: 'thick', color: '#112233' } }) });
    expect(frame.color).toBe('#112233');
    expect(frame.rects).toEqual([
      { x: 0, y: 327, width: 1000, height: 3 }, // inferior: fim do último fechamento (330)
      { x: 0, y: 180, width: 3, height: 150 }, // esquerda: do topo do 1º registro ao fim do fechamento
      { x: 997, y: 180, width: 3, height: 150 }, // direita
    ]);
  });

  it('só os lados ligados: sem lado superior não há linha no topo', () => {
    const [frame] = computeBandFrames(layers, { ...bands, dia: band('dia', { type: 'masterData', frame: { left: true } }) });
    expect(frame.rects).toHaveLength(1);
    expect(frame.rects[0].width).toBe(2);
  });

  it('banda filha com moldura envolve só ela e as filhas dela (registro), não os outros', () => {
    const frames = computeBandFrames(layers, { ...bands, prot: band('prot', { link: { parentBandId: 'dia', placement: 'above' }, frame: { top: true, bottom: true } }) });
    expect(frames).toHaveLength(1);
    expect(frames[0].rects).toEqual([
      { x: 0, y: 180, width: 1000, height: 2 },
      { x: 0, y: 294, width: 1000, height: 2 },
    ]);
  });

  it('banda estática (cabeçalho) sem filhas: a própria caixa', () => {
    const [frame] = computeBandFrames(layers, { ...bands, cab: band('cab', { type: 'pageHeader', frame: { top: true, left: true, right: true, bottom: true } }) });
    expect(frame.rects).toHaveLength(4);
    expect(frame.rects.find((r) => r.height === 2 && r.y === 0)).toEqual({ x: 0, y: 0, width: 1000, height: 2 });
  });

  it('banda com moldura mas sem camada nesta folha não desenha nada; sem moldura ligada também não', () => {
    expect(computeBandFrames([layer('o', 'outra', 0, 400, 1000, 20)], { ...bands, dia: band('dia', { frame: { left: true } }) })).toEqual([]);
    expect(computeBandFrames(layers, { ...bands, dia: band('dia', { frame: { thickness: 'thick' } }) })).toEqual([]);
  });

  it('duas bandas com moldura geram duas caixas independentes', () => {
    const frames = computeBandFrames(layers, { ...bands, cab: band('cab', { type: 'pageHeader', frame: { bottom: true } }), dia: band('dia', { type: 'masterData', frame: { top: true } }) });
    expect(frames).toHaveLength(2);
  });
});
