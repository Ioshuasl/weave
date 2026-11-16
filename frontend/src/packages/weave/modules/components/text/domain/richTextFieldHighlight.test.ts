import { describe, expect, it } from 'vitest';
import { richTextToHtml } from './richTextUtils';

describe('destaque sutil de campo dinâmico', () => {
  it('mantém a classe weave-field do renderizador e a formatação ao redor', () => {
    const html = richTextToHtml('**{a.b}** texto', (token) => `<span class="weave-field">${token}</span>`);
    expect(html).toBe('<strong><span class="weave-field">{a.b}</span></strong> texto');
  });

  it('não preserva outras classes em span', () => {
    expect(richTextToHtml('x', () => '')).toBe('x');
    const html = richTextToHtml('{a.b}', () => '<span class="outra" style="color:#ff0000">v</span>');
    expect(html).toBe('<span style="color:#ff0000">v</span>');
  });
});

describe('valor entra depois da formatação', () => {
  it('negrito em campo com valor de várias linhas não deixa ** soltos', () => {
    const html = richTextToHtml('**{a.devedor}**\n{a.endereco}', (token) => (token === '{a.devedor}' ? 'ANA\nBIA' : 'RUA 1'));
    expect(html).toBe('<strong>ANA<br />BIA</strong><br />RUA 1');
  });

  it('valor com marcadores não vira formatação', () => {
    expect(richTextToHtml('{a.x}', () => '**x** _y_ [size=20px]z')).toBe('**x** _y_ [size=20px]z');
  });
});
