import { describe, expect, it } from 'vitest';
import type { ReportBand } from '../../band/domain';
import type { PreviewLayer } from './previewTypes';
import { computeRegistroSides } from './registroLines';

const band = (id: string, sides: boolean, extra: Partial<ReportBand['lines']> = {}) =>
  ({ id, type: 'detailData', name: id, height: 16, components: [], lines: { sides, ...extra } }) as unknown as ReportBand;

const layer = (key: string, bandId: string, x: number, y: number, width: number, height: number, groupKey?: string): PreviewLayer => ({
  key,
  bandId,
  rect: { x, y, width, height },
  zIndex: 1,
  kind: 'data-row',
  groupKey,
});

/** Registro do Livro de Protocolos (Notas): Protocolo (esq., 16px) + Pessoas ao lado (3 linhas) + Lavratura abaixo (34px) */
const bands = { prot: band('prot', true), pess: band('pess', true), lav: band('lav', true), titulo: band('titulo', false) };
const registro = (g: string, y: number): PreviewLayer[] => [
  layer(g, 'prot', 0, y, 520, 16, g), // a camada da PAI tem a chave igual à groupKey (como no motor)
  layer(`${g}-p1`, 'pess', 524, y, 493, 16, g),
  layer(`${g}-p2`, 'pess', 524, y + 16, 493, 16, g),
  layer(`${g}-p3`, 'pess', 524, y + 32, 493, 16, g),
  layer(`${g}-lav`, 'lav', 0, y + 48, 1017, 34, g),
];

describe('computeRegistroSides', () => {
  it('desenha UMA lateral esquerda e UMA direita por registro, da primeira à última camada (sem buracos)', () => {
    const r = computeRegistroSides([...registro('a', 180), ...registro('b', 262)], bands);
    expect(r.groups).toHaveLength(2);
    expect(r.groups[0].rects).toEqual([
      { x: 0, y: 180, width: 1, height: 82 },
      { x: 1016, y: 180, width: 1, height: 82 },
    ]);
    expect(r.groups[1].rects[0]).toEqual({ x: 0, y: 262, width: 1, height: 82 });
  });

  it('suprime as laterais próprias de todas as camadas do registro e informa a extensão por banda', () => {
    const layers = registro('a', 0);
    const r = computeRegistroSides(layers, bands);
    expect([...r.suppressSides].sort()).toEqual(layers.map((l) => l.key).sort());
    expect(r.extentByBand.get('pess')).toEqual({ x: 0, width: 1017 });
  });

  it('usa espessura e cor da primeira banda do trecho', () => {
    const r = computeRegistroSides(registro('a', 0), { ...bands, prot: band('prot', true, { thickness: 'medium', color: '#ff0000' }) });
    expect(r.groups[0].color).toBe('#ff0000');
    expect(r.groups[0].rects[0].width).toBe(2);
    expect(r.groups[0].rects[1].x).toBe(1015);
  });

  it('laterais só na banda PAI valem para o registro inteiro (pai + filhas), mesmo sem laterais nas filhas', () => {
    const r = computeRegistroSides(registro('a', 0), { ...bands, pess: band('pess', false), lav: band('lav', false) });
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0].rects[0]).toEqual({ x: 0, y: 0, width: 1, height: 82 });
    expect(r.suppressSides.size).toBe(5);
  });

  it('sem laterais na pai, só entram as filhas com laterais ligadas (a pai não é suprimida nem entra na caixa)', () => {
    const r = computeRegistroSides(registro('a', 0), { ...bands, prot: band('prot', false) });
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0].rects[0]).toEqual({ x: 0, y: 0, width: 1, height: 82 });
    expect(r.suppressSides.has('a')).toBe(false);
    expect(r.suppressSides.has('a-lav')).toBe(true);
  });

  it('trecho de UMA banda só não muda nada (cada linha já desenha as suas)', () => {
    const r = computeRegistroSides([layer('l1', 'lav', 0, 0, 1017, 34, 'x'), layer('l2', 'lav', 0, 34, 1017, 34, 'x')], { ...bands, prot: band('prot', false) });
    expect(r.groups).toHaveLength(0);
    expect(r.suppressSides.size).toBe(0);
  });

  it('camada sem groupKey (paginação simples) nunca entra', () => {
    const r = computeRegistroSides(registro('a', 0).map((l) => ({ ...l, groupKey: undefined })), bands);
    expect(r.groups).toHaveLength(0);
  });

  it('camada sem laterais no meio quebra o trecho: a caixa não atravessa título/total', () => {
    const layers = registro('a', 0);
    layers[2] = { ...layers[2], bandId: 'titulo' };
    const r = computeRegistroSides(layers, { ...bands, prot: band('prot', false) }); // sem laterais na pai: vale o trecho contínuo
    expect(r.groups.every((g) => g.rects[0].height < 82)).toBe(true);
    expect(r.suppressSides.has('a-p2')).toBe(false);
  });

  it('registros diferentes não se juntam numa caixa só', () => {
    const r = computeRegistroSides([...registro('a', 0), ...registro('b', 82)], bands);
    expect(r.groups.map((g) => g.rects[0].y)).toEqual([0, 82]);
  });
});
