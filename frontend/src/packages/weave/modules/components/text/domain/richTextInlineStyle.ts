/** Marcadores markdown para cor e tamanho inline (trecho selecionado). */
export const INLINE_COLOR_RE =
  /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/g;
export const INLINE_SIZE_RE =
  /\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/g;

export function normalizeInlineColor(raw: string): string {
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/)!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^rgb/i.test(trimmed)) {
    const match = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (match) {
      const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
      return `#${hex(match[1])}${hex(match[2])}${hex(match[3])}`;
    }
  }
  return trimmed || '#000000';
}

export function normalizeInlineFontSize(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

const INLINE_STYLE_TAG = /\[(\/)?(size|color)(?:=([^\]\n"<>&]*))?\]/g;

/**
 * Converte os marcadores `[size=..]..[/size]` e `[color=..]..[/color]` (já escapados) em <span>, com pilha:
 * aceita aninhamento (o mais interno vence) e marcador que atravessa `**`/`_`; marcador sem par é descartado.
 * Roda ANTES dos demais marcadores inline para que `**[size=14px]x[/size]**` continue sendo negrito.
 */
export function inlineStyleTagsToHtml(text: string): string {
  const stack: Array<'size' | 'color'> = [];
  const html = text.replace(INLINE_STYLE_TAG, (match, closing: string | undefined, kind: 'size' | 'color', value?: string) => {
    if (closing) {
      if (stack[stack.length - 1] !== kind) return '';
      stack.pop();
      return '</span>';
    }
    if (!value) return match;
    stack.push(kind);
    return kind === 'size'
      ? `<span style="font-size:${value}" data-inline-size="${value}">`
      : `<span style="color:${value}" data-inline-color="${value}">`;
  });
  return html + '</span>'.repeat(stack.length);
}
