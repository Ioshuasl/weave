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

/** Processa wrappers [color] e [size] antes dos demais marcadores inline. */
export function markdownWithInlineStylesToHtml(
  text: string,
  renderCore: (segment: string) => string
): string {
  const colorRe = /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/;
  const sizeRe = /\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/;

  const colorMatch = colorRe.exec(text);
  const sizeMatch = sizeRe.exec(text);

  if (!colorMatch && !sizeMatch) {
    return renderCore(text);
  }

  const pickColor =
    colorMatch && (!sizeMatch || (colorMatch.index ?? 0) <= (sizeMatch.index ?? 0));
  const match = pickColor ? colorMatch! : sizeMatch!;
  const before = text.slice(0, match.index ?? 0);
  const after = text.slice((match.index ?? 0) + match[0].length);
  const attr = pickColor ? match[1] : match[1];
  const inner = match[2];
  const safeAttr = attr.replace(/"/g, '');

  const wrapped = pickColor
    ? `<span style="color:${safeAttr}" data-inline-color="${safeAttr}">${markdownWithInlineStylesToHtml(inner, renderCore)}</span>`
    : `<span style="font-size:${safeAttr}" data-inline-size="${safeAttr}">${markdownWithInlineStylesToHtml(inner, renderCore)}</span>`;

  return markdownWithInlineStylesToHtml(before, renderCore) + wrapped + markdownWithInlineStylesToHtml(after, renderCore);
}
