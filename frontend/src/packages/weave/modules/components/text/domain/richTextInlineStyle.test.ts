import { describe, expect, it } from 'vitest';
import { richTextToHtml } from './richTextUtils';

describe('tamanho e cor inline', () => {
  it('negrito por fora de [size] aninhado continua sendo negrito (caso do bug)', () => {
    const html = richTextToHtml('**[size=14px][size=18px]{a.selo}[/size][/size]**', (t) => t);
    expect(html).toBe(
      '<strong><span style="font-size:14px" data-inline-size="14px"><span style="font-size:18px" data-inline-size="18px">{a.selo}</span></span></strong>'
    );
    expect(html).not.toContain('[size');
    expect(html).not.toContain('**');
  });

  it('cor por dentro do negrito e marcador sem par é descartado', () => {
    expect(richTextToHtml('[color=#ff0000]**a**[/color] b[/size]')).toBe(
      '<span style="color:#ff0000" data-inline-color="#ff0000"><strong>a</strong></span> b'
    );
  });

  it('abertura sem fechamento fecha no fim', () => {
    expect(richTextToHtml('[size=20px]x')).toBe('<span style="font-size:20px" data-inline-size="20px">x</span>');
  });
});
