export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'none';

export interface ParsedBorder {
  width: number;
  style: BorderStyle;
  color: string;
  /** Valor original quando não segue o padrão `Npx estilo cor` */
  raw?: string;
}

const BORDER_PATTERN =
  /^(\d+(?:\.\d+)?)(px|pt|rem|em)?\s+(solid|dashed|dotted|double|none)\s+(.+)$/i;

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGB_COLOR = /^rgba?\([^)]+\)$/i;

export function normalizeBorderColor(raw: string): string {
  const trimmed = raw.trim();
  if (HEX_COLOR.test(trimmed)) {
    if (trimmed.length === 4) {
      const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/)!;
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return trimmed.toLowerCase();
  }
  return trimmed;
}

export function parseBorder(value?: string): ParsedBorder {
  if (!value?.trim() || value.trim() === 'none') {
    return { width: 0, style: 'solid', color: '#e5e5e5' };
  }

  const match = value.trim().match(BORDER_PATTERN);
  if (!match) {
    return { width: 1, style: 'solid', color: '#000000', raw: value.trim() };
  }

  const style = match[3].toLowerCase() as BorderStyle;
  if (style === 'none') {
    return { width: 0, style: 'solid', color: '#e5e5e5' };
  }

  return {
    width: Math.max(0, parseFloat(match[1])),
    style,
    color: normalizeBorderColor(match[4]),
  };
}

export function formatBorder(parsed: Pick<ParsedBorder, 'width' | 'style' | 'color'>): string | undefined {
  if (parsed.width <= 0 || parsed.style === 'none') return undefined;
  return `${parsed.width}px ${parsed.style} ${parsed.color}`;
}

export function isCustomBorder(value?: string): boolean {
  return Boolean(parseBorder(value).raw);
}

export function replaceBorderColor(value: string, color: string): string {
  const parsed = parseBorder(value);
  if (parsed.raw) {
    const normalized = normalizeBorderColor(color);
    if (RGB_COLOR.test(parsed.raw) || HEX_COLOR.test(parsed.raw)) return normalized;
    const match = parsed.raw.match(BORDER_PATTERN);
    if (match) {
      return `${match[1]}${match[2] ?? 'px'} ${match[3]} ${normalized}`;
    }
    return parsed.raw;
  }
  return formatBorder({ ...parsed, color: normalizeBorderColor(color) }) ?? '';
}

export interface ParsedBorderRadius {
  px: number;
  raw?: string;
}

export function parseBorderRadius(value?: string): ParsedBorderRadius {
  if (!value?.trim()) return { px: 0 };
  const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/i);
  if (match) return { px: Math.max(0, parseFloat(match[1])) };
  return { px: 0, raw: value.trim() };
}

export function formatBorderRadius(parsed: ParsedBorderRadius): string | undefined {
  if (parsed.raw) return parsed.raw || undefined;
  if (parsed.px <= 0) return undefined;
  return `${parsed.px}px`;
}
