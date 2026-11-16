import { describe, expect, it } from 'vitest';
import { expandCalculos, renameCalculo, validateCalculos, type ReportCalculo } from './calculos';
import { buildExpressionFieldSuggestions, filterExpressionSuggestions } from './expressionFieldSuggestions';
import { evaluateExpression } from './expressionUtils';
import { getFieldChipDisplayLabel } from './fieldTokenUtils';
import { checkFormula } from './formulaPt';

const selos = [
  { valor_emolumento: '2789.06', valor_taxa_judiciaria: '110.38', emolumento_sinoreg_3: '0', emolumento_sinoreg_6: '2789.06', quantidade_atos: '2' },
  { valor_emolumento: '6528.51', valor_taxa_judiciaria: '165.57', emolumento_sinoreg_3: '0', emolumento_sinoreg_6: '6528.51', quantidade_atos: '3' },
];
const data = { selos };

const calculos: ReportCalculo[] = [
  { id: 'a', nome: 'Advogados Dativos', formula: '[valor_emolumento] * 2%' },
  { id: 'b', nome: 'FUNPROGE', formula: '[valor_emolumento] * 2%' },
  { id: 'c', nome: 'FUNDEPEG', formula: '[valor_emolumento] * 1,25%' },
  { id: 'd', nome: 'FUNDESP', formula: '[valor_emolumento] * 10%' },
  { id: 'e', nome: 'FUNEMP', formula: '[valor_emolumento] * 3%' },
  { id: 'f', nome: 'SINOREG até 23/03', formula: '[emolumento_sinoreg_3] * 3%' },
  { id: 'g', nome: 'SINOREG desde 24/03', formula: '[emolumento_sinoreg_6] * 6%' },
  { id: 'h', nome: 'ISS', formula: '[valor_emolumento] * 5%' },
  {
    id: 'i',
    nome: 'Total de Fundos',
    formula: 'Advogados Dativos + FUNPROGE + FUNDEPEG + FUNDESP + FUNEMP + SINOREG até 23/03 + SINOREG desde 24/03',
  },
  { id: 'j', nome: 'Total SEFAZ', formula: 'Advogados Dativos + FUNPROGE + FUNDEPEG', somenteNoFinal: true },
];

const report = (content: string, extra: ReportCalculo[] = calculos) =>
  expandCalculos({
    calculos: extra,
    bands: {},
    components: { c1: { id: 'c1', type: 'text', content } },
  }).components.c1.content;

const render = (content: string, row?: Record<string, unknown>, extra?: ReportCalculo[]) =>
  evaluateExpression(report(content, extra), { row, data });

describe('fórmulas em português', () => {
  it('calcula com porcentagem e vírgula decimal', () => {
    expect(evaluateExpression('{=MOEDA([valor_emolumento] * 1,25%)}', { row: selos[0], data })).toBe('34,86');
  });

  it('SOMA, CONTAR e TOTAL sobre a lista', () => {
    expect(evaluateExpression('{=MOEDA(SOMA([valor_emolumento]))}', { data })).toBe('9.317,57');
    expect(evaluateExpression('{=CONTAR([valor_emolumento])}', { data })).toBe('2');
    expect(evaluateExpression('{=MOEDA(TOTAL(ARREDONDAR([valor_emolumento] * 5%; 2)))}', { data })).toBe('465,88');
  });

  it('SE, E e comparações', () => {
    const regra = '{=SE(E([valor_emolumento] > 3000; [quantidade_atos] >= 3); "alto"; "baixo")}';
    expect(evaluateExpression(regra, { row: selos[1], data })).toBe('alto');
    expect(evaluateExpression(regra, { row: selos[0], data })).toBe('baixo');
  });

  it('erro em português com sugestão', () => {
    const resultado = checkFormula('[valor_emolumeto] * 2%', { row: selos[0], data });
    expect(resultado).toMatchObject({ ok: false, message: 'O campo [valor_emolumeto] não existe.', suggestion: 'Você quis dizer [valor_emolumento]?' });
    expect(checkFormula('ARREDONDAR([valor_emolumento]; 2', { data })).toMatchObject({ ok: false });
    expect(evaluateExpression('{=SOMAA([valor_emolumento])}', { data })).toContain('Você quis dizer SOMA?');
  });
});

describe('cálculos com nome', () => {
  it('usa o nome do cálculo na linha (Total de Fundos bate com o PDF)', () => {
    expect(render('{MOEDA(Total de Fundos)}', selos[0])).toBe('676,34');
    expect(render('{MOEDA(Total de Fundos)}', selos[1])).toBe('1.583,17');
    expect(render('{Total de Fundos}', selos[0])).toBe('676,34');
    expect(render('{MOEDA(ISS)}', selos[0])).toBe('139,45');
  });

  it('SOMA das linhas x TOTAL sobre os totais', () => {
    expect(render('{MOEDA(SOMA(ISS))}')).toBe('465,88');
    expect(render('{MOEDA(TOTAL(ISS))}')).toBe('465,88');
    expect(render('{MOEDA(SOMA(Total de Fundos))}')).toBe('2.259,51');
  });

  it('"arredondar só no final" soma sem arredondar as parcelas', () => {
    const umSelo = { selos: [{ valor_emolumento: '7.3' }] };
    const calcular = (lista: ReportCalculo[]) =>
      evaluateExpression(report('{MOEDA(TOTAL(Total SEFAZ))}', lista), { data: umSelo });
    expect(calcular(calculos)).toBe('0,38');
    expect(calcular(calculos.map((c) => (c.id === 'j' ? { ...c, somenteNoFinal: false } : c)))).toBe('0,39');
  });

  it('aceita colchetes e não mexe em campos nem fórmulas antigas', () => {
    expect(render('{MOEDA([ISS])}', selos[0])).toBe('139,45');
    expect(render('{selos.valor_emolumento}', selos[0])).toBe('2789.06');
    expect(render('{money(round(selos.valor_emolumento*0.05,2))}', selos[0])).toBe('139,45');
  });

  it('detecta ciclo e nome duplicado', () => {
    const ciclo: ReportCalculo[] = [
      { id: 'x', nome: 'A', formula: 'B + 1' },
      { id: 'y', nome: 'B', formula: 'A + 1' },
    ];
    expect(validateCalculos(ciclo)[0].message).toContain('Cálculo circular: A → B → A');
    expect(render('{A}', selos[0], ciclo)).toContain('⚠ Cálculo circular');
    expect(validateCalculos([{ id: '1', nome: 'ISS', formula: '1' }, { id: '2', nome: 'iss', formula: '2' }])[0].message).toContain('Já existe');
  });
});

describe('renomear cálculo', () => {
  it('atualiza as fórmulas dos outros cálculos e o layout', () => {
    const base = {
      calculos: [
        { id: '1', nome: 'FUNPROGE', formula: '[v] * 2%' },
        { id: '2', nome: 'Total', formula: 'FUNPROGE + [valor]' },
      ],
      bands: {},
      components: { c1: { content: '{MOEDA(FUNPROGE)} FUNPROGE fora do token' } },
    };
    const renamed = renameCalculo(base, '1', 'Fundo Procuradoria');
    expect(renamed.calculos?.[0].nome).toBe('Fundo Procuradoria');
    expect(renamed.calculos?.[1].formula).toBe('Fundo Procuradoria + [valor]');
    expect(renamed.components.c1.content).toBe('{MOEDA(Fundo Procuradoria)} FUNPROGE fora do token');
  });
});

describe('autocomplete e chips', () => {
  it('sugere os cálculos com prévia e nome legível no chip', () => {
    const grupos = buildExpressionFieldSuggestions({ selos }, { selos: { kind: 'list' } }, { calculos });
    const grupo = grupos.find((item) => item.id === 'calculos');
    expect(grupo?.items.find((item) => item.token === '{MOEDA(ISS)}')).toMatchObject({ label: 'ISS', preview: '139,45' });
    expect(grupo?.items.map((item) => item.token)).toContain('{MOEDA(SOMA(Total de Fundos))}');
    expect(filterExpressionSuggestions(grupos, 'sefaz')[0].items.every((item) => item.label.includes('Total SEFAZ'))).toBe(true);
    expect(getFieldChipDisplayLabel('{MOEDA(SOMA(Total de Fundos))}')).toBe('Total de Fundos (soma das linhas)');
    expect(getFieldChipDisplayLabel('{MOEDA(TOTAL(ISS))}')).toBe('ISS (sobre o total)');
    expect(getFieldChipDisplayLabel('{MOEDA(Total de Fundos)}')).toBe('Total de Fundos');
  });
});

describe('arredondamento decimal exato', () => {
  it('arredonda meia-casa para cima sem erro de ponto flutuante', () => {
    const arredondar = (valor: string) => evaluateExpression(`{=ARREDONDAR(${valor}; 2)}`, { data });
    expect(arredondar('254,785')).toBe('254,79');
    expect(arredondar('3,555')).toBe('3,56');
    expect(arredondar('1,005')).toBe('1,01');
    expect(arredondar('2547,85 * 10%')).toBe('254,79');
    expect(arredondar('-2,675')).toBe('-2,68');
    expect(arredondar('0,004')).toBe('0');
  });
});
