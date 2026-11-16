import { beforeAll, describe, expect, it } from 'vitest';
import { editorHtmlToMarkdown } from './richTextEditorUtils';

type Fake = {
  nodeType: number;
  tagName?: string;
  textContent?: string;
  childNodes: Fake[];
  dataset: Record<string, string>;
  style: Record<string, string>;
  getAttribute: (name: string) => string | null;
};

const baseStyle = () => ({ fontWeight: '', fontStyle: '', textDecoration: '' });
const text = (value: string): Fake => ({ nodeType: 3, textContent: value, childNodes: [], dataset: {}, style: baseStyle(), getAttribute: () => null });
const el = (tagName: string, children: Fake[] = [], extra: Partial<Fake> = {}): Fake => ({
  nodeType: 1,
  tagName,
  childNodes: children,
  dataset: {},
  style: baseStyle(),
  getAttribute: () => null,
  ...extra,
});
const chip = (token: string, style: Record<string, string> = {}) => el('SPAN', [text('rótulo')], { dataset: { field: token }, style: { ...baseStyle(), ...style } });
const serialize = (children: Fake[]) => editorHtmlToMarkdown({ childNodes: children } as never);

describe('serialização do editor de texto', () => {
  beforeAll(() => {
    (globalThis as { Node?: unknown }).Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  });

  it('negrito que atravessa quebra de linha vira um par de ** por linha', () => {
    const md = serialize([el('B', [text('Poder Judiciário'), el('BR'), text('Selo Eletrônico'), el('BR')]), chip('{a.selo}')]);
    expect(md).toBe('**Poder Judiciário**\n**Selo Eletrônico**\n{a.selo}');
  });

  it('campo com negrito inline vira **{campo}**', () => {
    expect(serialize([text('x '), chip('{a.selo}', { fontWeight: '700' })])).toBe('x **{a.selo}**');
  });

  it('campo dentro de <b> não duplica marcadores', () => {
    expect(serialize([el('B', [text('x '), chip('{a.selo}')])])).toBe('**x {a.selo}**');
  });

  it('espaços nas bordas ficam fora dos marcadores', () => {
    expect(serialize([el('B', [text(' texto ')])])).toBe(' **texto** ');
  });

  it('primeira linha solta + <div> (Enter do Chrome) mantém a quebra de linha', () => {
    expect(serialize([text('L1'), el('DIV', [text('L2')])])).toBe('L1\nL2');
  });

  it('<div> seguido de <div> não duplica a quebra', () => {
    expect(serialize([el('DIV', [text('L1')]), el('DIV', [text('L2')])])).toBe('L1\nL2');
  });

  it('linha em branco (<div><br></div>) vira linha vazia', () => {
    expect(serialize([text('L1'), el('DIV', [el('BR')]), el('DIV', [text('L2')])])).toBe('L1\n\nL2');
  });

  it('negrito na primeira linha + <div> não perde a quebra', () => {
    expect(serialize([el('B', [text('L1')]), el('DIV', [el('B', [text('L2')])])])).toBe('**L1**\n**L2**');
  });

  it('<div> dentro de span com tamanho não deixa \n dentro do marcador', () => {
    const sized = el('SPAN', [text('L1'), el('DIV', [text('L2')])], { dataset: { inlineSize: '14px' }, style: { ...baseStyle(), fontSize: '14px' }, getAttribute: (n: string) => (n === 'data-inline-size' ? '14px' : null) });
    expect(serialize([sized])).toBe('[size=14px]L1\nL2[/size]');
  });

  it('span de tamanho vazio não gera marcador', () => {
    const vazio = el('SPAN', [], { dataset: { inlineSize: '14px' }, style: { ...baseStyle(), fontSize: '14px' }, getAttribute: (n: string) => (n === 'data-inline-size' ? '14px' : null) });
    expect(serialize([text('a'), vazio])).toBe('a');
  });
});
