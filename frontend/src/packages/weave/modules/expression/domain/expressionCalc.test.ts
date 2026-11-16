import { describe, expect, it } from 'vitest';
import { evaluateExpression } from './expressionUtils';

const data = {
  selos: [
    { valor_emolumento: '2789.06', emolumento_sinoreg_3: '0', emolumento_sinoreg_6: '2789.06' },
    { valor_emolumento: '6528.51', emolumento_sinoreg_3: '0', emolumento_sinoreg_6: '6528.51' },
  ],
};

describe('evaluateExpression com cálculo', () => {
  it('formata valor da linha em reais', () => {
    expect(evaluateExpression('{money(selos.valor_emolumento)}', data.selos[0])).toBe('2.789,06');
  });

  it('soma coluna do dataset', () => {
    expect(evaluateExpression('{money(sum(selos.valor_emolumento))}', { data })).toBe('9.317,57');
  });

  it('calcula percentual arredondado por componente', () => {
    const fundos = '{money(round(selos.valor_emolumento * 0.02, 2) * 2 + round(selos.valor_emolumento * 0.0125, 2) + round(selos.valor_emolumento * 0.1, 2) + round(selos.valor_emolumento * 0.03, 2) + round(selos.emolumento_sinoreg_6 * 0.06, 2))}';
    expect(evaluateExpression(fundos, data.selos[0])).toBe('676,34');
  });

  it('soma uma expressão avaliada linha a linha', () => {
    expect(
      evaluateExpression('{money(sum(selos, round(selos.valor_emolumento * 0.05, 2)))}', { data }),
    ).toBe('465,88');
  });

  it('mantém o token quando a expressão é inválida', () => {
    expect(evaluateExpression('{foo(selos.x)}', { data })).toBe('{foo(selos.x)}');
  });

  it('não altera campo simples', () => {
    expect(evaluateExpression('{selos.valor_emolumento}', data.selos[0])).toBe('2789.06');
  });
});

describe('normalização de texto com expressões', () => {
  it('não converte * e _ de uma fórmula em itálico', async () => {
    const { normalizeTextComponent } = await import('@/packages/weave/modules/components/text/domain');
    const content = '{money(round(selos.valor_emolumento*0.02,2)*2+round(selos.valor_emolumento*0.0125,2))}';
    const normalized = normalizeTextComponent({
      id: 'c1',
      type: 'text',
      name: 'c1',
      rect: { x: 0, y: 0, width: 10, height: 10 },
      content,
      style: { fontWeight: 'bold' },
    } as never);
    expect(normalized.content).toBe(`**${content}**`);
    expect(evaluateExpression(normalized.content, data.selos[0])).toBe('**146,42**');
  });
});
