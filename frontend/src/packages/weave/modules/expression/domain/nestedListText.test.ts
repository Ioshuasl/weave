import { describe, expect, it } from 'vitest';
import { flattenNestedData } from '../../data-source/domain';
import { evaluateExpression } from './expressionUtils';
import { expandNestedListContent } from './nestedListText';

const flat = flattenNestedData(
  {
    instrumentos: [
      { numero: '1', devedores: [{ nome: 'ANA', documento: '111', endereco: 'RUA A' }, { nome: 'BIA', documento: '222', endereco: 'RUA B' }] },
      { numero: '2', devedores: [{ nome: 'CAIO', documento: '333', endereco: 'RUA C' }] },
      { numero: '3', devedores: [] },
    ],
  },
  { devedores: { kind: 'list' } }
)!;
const render = (content: string, index: number) => {
  const row = flat.data.instrumentos[index] as Record<string, unknown>;
  const ctx = { row, data: flat.data, dataSourceCatalog: flat.catalog };
  return evaluateExpression(expandNestedListContent(content, ctx), ctx);
};

describe('texto com lista aninhada', () => {
  it('repete o texto por devedor da linha atual', () => {
    expect(render('{devedores.nome}\n{devedores.endereco}', 0)).toBe('ANA\nRUA A\nBIA\nRUA B');
    expect(render('{devedores.nome}\n{devedores.endereco}', 1)).toBe('CAIO\nRUA C');
  });

  it('a coluna de documentos fica alinhada (linha em branco no lugar do endereço)', () => {
    expect(render('{devedores.documento}\n', 0).split('\n')).toEqual(['111', '', '222', '']);
  });

  it('lista vazia some e texto sem lista aninhada fica intacto', () => {
    expect(render('{devedores.nome}', 2)).toBe('');
    expect(render('Apont. {instrumentos.numero}', 0)).toBe('Apont. 1');
  });

  it('mistura campo do registro com campos da lista', () => {
    expect(render('{instrumentos.numero}: {devedores.nome}', 0)).toBe('1: ANA\n1: BIA');
  });
});
