import { describe, expect, it } from 'vitest';
import { getBorderSides, hasSideBorders, mergeBorderPatch, setBorderSides } from './componentBorders';

const B = '1px solid #000000';
const R = '2px solid #ff0000';

describe('getBorderSides', () => {
  it('o atalho `border` vale para os 4 lados', () => {
    expect(getBorderSides({ border: B })).toEqual({ top: B, right: B, bottom: B, left: B });
  });
  it('lados sobrepõem o atalho e "none" desliga o lado', () => {
    expect(getBorderSides({ border: B, borderTop: 'none', borderLeft: R })).toEqual({ right: B, bottom: B, left: R });
  });
  it('só lados: só eles; sem nada: vazio; border "none" = sem borda', () => {
    expect(getBorderSides({ borderBottom: B })).toEqual({ bottom: B });
    expect(getBorderSides(undefined)).toEqual({});
    expect(getBorderSides({ border: 'none' })).toEqual({});
  });
});

describe('setBorderSides', () => {
  it('liga um lado num estilo sem borda: só aquele lado, sem atalho', () => {
    expect(setBorderSides({ color: '#111' }, { bottom: B })).toEqual({ color: '#111', borderBottom: B });
  });
  it('desligar um lado do atalho expande em 3 lados e remove o atalho', () => {
    expect(setBorderSides({ border: B }, { top: undefined })).toEqual({ borderRight: B, borderBottom: B, borderLeft: B });
  });
  it('os 4 lados iguais voltam ao atalho `border` (compatível e menor)', () => {
    expect(setBorderSides({ borderTop: B, borderRight: B, borderBottom: B }, { left: B })).toEqual({ border: B });
  });
  it('lados diferentes ficam cada um com o seu valor', () => {
    expect(setBorderSides({ border: B }, { left: R })).toEqual({ borderTop: B, borderRight: B, borderBottom: B, borderLeft: R });
  });
  it('nunca deixa atalho e lados juntos e não muta o original', () => {
    const original = { border: B, borderTop: R };
    const out = setBorderSides(original, { bottom: undefined });
    expect('border' in out && Object.keys(out).some((k) => k.startsWith('borderT'))).toBe(false);
    expect(original).toEqual({ border: B, borderTop: R });
  });
  it('desligar todos remove tudo', () => {
    expect(setBorderSides({ border: B }, { top: undefined, right: undefined, bottom: undefined, left: undefined })).toEqual({});
  });
});

describe('mergeBorderPatch (patch cru do assistente)', () => {
  it('só um lado novo sobre um atalho existente: os outros 3 continuam', () => {
    expect(mergeBorderPatch({ border: B }, { border: B, borderLeft: R })).toEqual({ borderTop: B, borderRight: B, borderBottom: B, borderLeft: R });
  });
  it('remover um lado (chave sumiu) tira só aquele lado', () => {
    expect(mergeBorderPatch({ borderTop: B, borderBottom: B }, { borderTop: B })).toEqual({ borderTop: B });
  });
  it('mudar `border` vale para os 4 lados e apaga os lados antigos', () => {
    expect(mergeBorderPatch({ borderTop: B, borderLeft: R }, { borderTop: B, borderLeft: R, border: R })).toEqual({ border: R });
  });
  it('remover `border` apaga tudo, inclusive os lados', () => {
    expect(mergeBorderPatch({ border: B, borderLeft: R }, { borderLeft: R })).toEqual({});
  });
  it('border e um lado juntos: border é a base e o lado sobrepõe', () => {
    expect(mergeBorderPatch({}, { border: B, borderBottom: R })).toEqual({ borderTop: B, borderRight: B, borderLeft: B, borderBottom: R });
  });
  it('sem mudança de borda devolve o mesmo estilo', () => {
    const style = { color: '#111', border: B };
    expect(mergeBorderPatch(style, { ...style, color: '#222' })).toEqual({ color: '#222', border: B });
  });
});

describe('hasSideBorders', () => {
  it('detecta lado definido à parte', () => {
    expect(hasSideBorders({ borderBottom: B })).toBe(true);
    expect(hasSideBorders({ border: B })).toBe(false);
    expect(hasSideBorders(undefined)).toBe(false);
  });
});

import { omitBorderKeys, resolveBorderCss, resolveBorderCssForRender } from './componentBorders';

describe('resolveBorderCss (renderers)', () => {
  const U = undefined;
  it('sem borda e sem padrão: tudo undefined (neutraliza o que veio no spread)', () => {
    expect(resolveBorderCss({})).toEqual({ border: U, borderTop: U, borderRight: U, borderBottom: U, borderLeft: U });
  });
  it('forma sem borda definida usa a borda padrão; com um lado definido NÃO volta a caixa por cima', () => {
    expect(resolveBorderCss({}, '1px solid #000').border).toBe('1px solid #000');
    const sides = resolveBorderCss({ borderBottom: '1px solid #000000' }, '1px solid #000');
    expect(sides.border).toBeUndefined();
    expect(sides.borderBottom).toBe('1px solid #000000');
    expect(sides.borderTop).toBeUndefined();
  });
  it('border "none" explícito vence a borda padrão (como antes)', () => {
    expect(resolveBorderCss({ border: 'none' }, '1px solid #000').border).toBe('none');
  });
  it('lados diferentes saem por lado; legado com atalho + lado: o lado sobrepõe', () => {
    const css = resolveBorderCss({ border: '1px solid #000000', borderLeft: '3px solid #ff0000', borderTop: 'none' });
    expect(css.border).toBeUndefined();
    expect(css.borderLeft).toBe('3px solid #ff0000');
    expect(css.borderRight).toBe('1px solid #000000');
    expect(css.borderTop).toBeUndefined();
  });
  it('atalho sozinho continua como `border`', () => {
    expect(resolveBorderCss({ border: '2px dashed #111111' }).border).toBe('2px dashed #111111');
  });
});

describe('resolveBorderCssForRender / omitBorderKeys', () => {
  it('atalho sozinho sai só com `border` (sem lados undefined que o limpariam)', () => {
    const css = resolveBorderCssForRender({ border: '1px solid #000000' });
    expect(Object.keys(css)).toEqual(['border']);
  });
  it('sem borda: nenhuma chave', () => {
    expect(resolveBorderCssForRender({})).toEqual({});
  });
  it('lados diferentes: só os lados ligados', () => {
    expect(resolveBorderCssForRender({ borderTop: '1px solid #000000', borderLeft: '2px solid #ff0000' })).toEqual({
      borderTop: '1px solid #000000',
      borderLeft: '2px solid #ff0000',
    });
  });
  it('omitBorderKeys remove as 5 chaves e preserva o resto', () => {
    expect(omitBorderKeys({ border: '1px solid #000', borderTop: 'none', color: 'red' })).toEqual({ color: 'red' });
  });
});
