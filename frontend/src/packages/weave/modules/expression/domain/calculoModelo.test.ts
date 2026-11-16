import { describe, expect, it } from 'vitest';
import { buildCalculoFormula, parseCalculoModelo } from './calculoModelo';

describe('modelo visual do cálculo', () => {
  it('reconhece percentual e reconstrói a fórmula', () => {
    const modelo = parseCalculoModelo('[valor_emolumento] * 1,25%');
    expect(modelo).toEqual({ tipo: 'percentual', base: 'valor_emolumento', percentual: '1,25' });
    expect(buildCalculoFormula(modelo)).toBe('[valor_emolumento] * 1,25%');
  });

  it('reconhece soma de cálculos pelos nomes', () => {
    const modelo = parseCalculoModelo('Advogados Dativos + FUNPROGE + SINOREG até 23/03');
    expect(modelo).toEqual({ tipo: 'soma', termos: ['Advogados Dativos', 'FUNPROGE', 'SINOREG até 23/03'] });
    expect(buildCalculoFormula(modelo)).toBe('Advogados Dativos + FUNPROGE + SINOREG até 23/03');
  });

  it('reconhece regra se/então/senão com uma ou várias condições', () => {
    const simples = parseCalculoModelo('SE([valor_emolumento] > 1000; [valor_emolumento] * 1%; 0)');
    expect(simples).toEqual({
      tipo: 'regra',
      ligacao: 'E',
      condicoes: [{ campo: 'valor_emolumento', operador: '>', valor: '1000' }],
      entao: '[valor_emolumento] * 1%',
      senao: '0',
    });
    const composta = parseCalculoModelo('SE(E([codigo_ato] >= 2143; [codigo_ato] <= 2171); [valor_emolumento] * 1%; 0)');
    expect(composta).toMatchObject({ tipo: 'regra', ligacao: 'E', condicoes: [{ operador: '>=' }, { operador: '<=' }] });
    expect(buildCalculoFormula(composta)).toBe('SE(E([codigo_ato] >= 2143; [codigo_ato] <= 2171); [valor_emolumento] * 1%; 0)');
    expect(parseCalculoModelo('SE(OU([a] = 1; [b] <> 2); 1; 0)')).toMatchObject({ ligacao: 'OU' });
  });

  it('cai em fórmula livre quando não se encaixa em um cartão', () => {
    expect(parseCalculoModelo('ARREDONDAR([a] * 3; 2)')).toEqual({ tipo: 'formula', formula: 'ARREDONDAR([a] * 3; 2)' });
    expect(parseCalculoModelo('SE(SOMA([a]) > 1; 1; 0)')).toMatchObject({ tipo: 'formula' });
  });
});
