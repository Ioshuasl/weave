import { describe, expect, it } from 'vitest';
import { flattenNestedData, getVisibleFieldKeys } from './nestedData';

describe('listas aninhadas', () => {
  const data = {
    cartorio: [{ nome: 'Cartório' }],
    instrumentos: [
      { numero: '1', devedores: [{ nome: 'ANA' }, { nome: 'BIA' }] },
      { numero: '2', devedores: [{ nome: 'CAIO' }] },
      { numero: '3', devedores: [] },
    ],
  };

  it('vira dataset filho ligado ao pai por __linha/__pai', () => {
    const flat = flattenNestedData(data, undefined)!;
    expect(flat.data.instrumentos).toEqual([
      { numero: '1', __linha: 0 },
      { numero: '2', __linha: 1 },
      { numero: '3', __linha: 2 },
    ]);
    expect(flat.data.devedores).toEqual([
      { nome: 'ANA', __pai: 0, __linha: 0 },
      { nome: 'BIA', __pai: 0, __linha: 1 },
      { nome: 'CAIO', __pai: 1, __linha: 2 },
    ]);
    expect(flat.data.cartorio).toEqual([{ nome: 'Cartório', __linha: 0 }]);
  });

  it('o catálogo ganha o pai, preservando rótulo e campos informados pelo host', () => {
    const flat = flattenNestedData(data, { devedores: { kind: 'list', label: 'Devedores', fields: { nome: 'Nome' } } })!;
    expect(flat.catalog?.devedores).toEqual({ kind: 'list', label: 'Devedores', fields: { nome: 'Nome' }, parent: 'instrumentos' });
  });

  it('sem listas aninhadas devolve os mesmos dados', () => {
    const plain = { a: [{ x: 1 }] };
    expect(flattenNestedData(plain, undefined)!.data).toBe(plain);
  });

  it('campos internos ficam fora da lista de campos', () => {
    expect(getVisibleFieldKeys({ nome: 'x', __pai: 1, __linha: 0 })).toEqual(['nome']);
  });
});
