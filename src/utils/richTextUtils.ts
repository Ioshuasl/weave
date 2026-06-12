import type { CSSProperties } from 'react';
import type { ReportComponent } from '../types/report';

const HTML_ALLOWED_TAGS = new Set([
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'del',
  'br',
  'p',
  'span',
]);

export type TextFormatKind = 'bold' | 'italic' | 'underline' | 'strike';

/** Marcadores canônicos — negrito `**` e itálico `_` não se sobrepõem */
export const TEXT_FORMAT_MARKERS: Record<
  TextFormatKind,
  { before: string; after: string; sample: string }
> = {
  bold: { before: '**', after: '**', sample: 'negrito' },
  italic: { before: '_', after: '_', sample: 'itálico' },
  underline: { before: '++', after: '++', sample: 'sublinhado' },
  strike: { before: '~~', after: '~~', sample: 'traçado' },
};

const BOLD_VARIANTS = [
  { open: '**', close: '**' },
  { open: '__', close: '__' },
] as const;

/** Legado: `*itálico*` ainda é reconhecido ao abrir conteúdo antigo */
const ITALIC_VARIANTS = [
  { open: '_', close: '_' },
  { open: '*', close: '*' },
] as const;

const SIMPLE_WRAPPERS: Record<'underline' | 'strike', { open: string; close: string }[]> = {
  underline: [{ open: '++', close: '++' }],
  strike: [{ open: '~~', close: '~~' }],
};

const LEGACY_ASTERISK_ITALIC = /(?<!\*)\*([^*\n]+?)\*(?!\*)/g;
const UNDERSCORE_ITALIC = /(?<![_])_([^_\n]+?)_(?![_])/g;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Converte markdown inline (subset) para HTML */
export function markdownInlineToHtml(text: string): string {
  let html = escapeHtml(text);

  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\+\+(.+?)\+\+/g, '<u>$1</u>');
  html = html.replace(UNDERSCORE_ITALIC, '<em>$1</em>');
  html = html.replace(LEGACY_ASTERISK_ITALIC, '<em>$1</em>');

  return html.replace(/\n/g, '<br />');
}

export function sanitizeRichHtml(html: string): string {
  return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) => {
    const name = tag.toLowerCase();
    if (!HTML_ALLOWED_TAGS.has(name)) return '';
    if (match.startsWith('</')) return `</${name}>`;
    if (name === 'br') return '<br />';
    return `<${name}>`;
  });
}

export function richTextToHtml(content: string): string {
  if (!content) return '';
  return sanitizeRichHtml(markdownInlineToHtml(content));
}

/** Normaliza marcadores legados para o par canônico `**` / `_` */
export function canonicalizeMarkdownMarkers(text: string): string {
  let result = text.replace(/__(.+?)__/g, '**$1**');
  result = result.replace(LEGACY_ASTERISK_ITALIC, '_$1_');
  return result;
}

/** Converte HTML legado (subset) para markdown inline */
export function htmlToMarkdown(html: string): string {
  return canonicalizeMarkdownMarkers(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(strong|b)>/gi, '**')
      .replace(/<\/?(em|i)>/gi, '_')
      .replace(/<\/?u>/gi, '++')
      .replace(/<\/?(s|strike|del)>/gi, '~~')
      .replace(/<[^>]+>/g, '')
  );
}

function isBoldStyle(style: CSSProperties): boolean {
  const w = style.fontWeight;
  return w === 'bold' || w === 700 || w === '700' || w === 600 || w === '600';
}

function applyStyleHintsToMarkdown(content: string, style: CSSProperties): string {
  let next = content;
  if (isBoldStyle(style) && !/\*\*|__/.test(next)) {
    next = `**${next}**`;
  }
  if (style.fontStyle === 'italic' && !/(?<![_])_[^_\n]+_(?![_])/.test(next)) {
    next = `_${next}_`;
  }
  if (style.textDecoration === 'underline' && !/\+\+/.test(next)) {
    next = `++${next}++`;
  }
  if (style.textDecoration === 'line-through' && !/~~/.test(next)) {
    next = `~~${next}~~`;
  }
  return next;
}

export function normalizeTextComponent(comp: ReportComponent): ReportComponent {
  if (comp.type !== 'text') return comp;

  let content = comp.content ?? '';
  const legacyFormat = comp.textFormat;

  if (legacyFormat === 'html') {
    content = htmlToMarkdown(content);
  } else if (legacyFormat !== 'markdown') {
    content = applyStyleHintsToMarkdown(content, comp.style);
  }

  content = canonicalizeMarkdownMarkers(content);

  const nextStyle = { ...comp.style };
  if (isBoldStyle(nextStyle)) delete nextStyle.fontWeight;
  if (nextStyle.fontStyle === 'italic') delete nextStyle.fontStyle;
  if (
    nextStyle.textDecoration === 'underline' ||
    nextStyle.textDecoration === 'line-through'
  ) {
    delete nextStyle.textDecoration;
  }

  const { textFormat: _removed, ...rest } = comp;
  return { ...rest, content, style: nextStyle };
}

function expandToWord(text: string, pos: number): { start: number; end: number } {
  if (!text.length) return { start: pos, end: pos };
  let start = pos;
  let end = pos;
  while (start > 0 && !/\s/.test(text[start - 1])) start -= 1;
  while (end < text.length && !/\s/.test(text[end])) end += 1;
  return { start, end };
}

function isInsideWrapper(
  text: string,
  pos: number,
  open: string,
  close: string
): boolean {
  let i = 0;
  while (i < text.length) {
    const openIdx = text.indexOf(open, i);
    if (openIdx === -1) break;
    const contentStart = openIdx + open.length;
    const closeIdx = text.indexOf(close, contentStart);
    if (closeIdx === -1) break;
    if (pos >= contentStart && pos <= closeIdx) return true;
    i = closeIdx + close.length;
  }
  return false;
}

function isSelectionWrapped(
  text: string,
  start: number,
  end: number,
  open: string,
  close: string
): boolean {
  return (
    start >= open.length &&
    end + close.length <= text.length &&
    text.slice(start - open.length, start) === open &&
    text.slice(end, end + close.length) === close
  );
}

function isSingleDelimiterWrapped(
  text: string,
  start: number,
  end: number,
  delimiter: '_' | '*'
): boolean {
  if (
    start < 1 ||
    end + 1 > text.length ||
    text[start - 1] !== delimiter ||
    text[end] !== delimiter
  ) {
    return false;
  }

  const openIsPaired = start >= 2 && text[start - 2] === delimiter;
  const closeIsPaired = end + 1 < text.length && text[end + 1] === delimiter;
  return !openIsPaired && !closeIsPaired;
}

function isInsideSingleDelimiterWrapper(
  text: string,
  pos: number,
  delimiter: '_' | '*'
): boolean {
  const pattern = delimiter === '_' ? UNDERSCORE_ITALIC : LEGACY_ASTERISK_ITALIC;
  const regex = new RegExp(pattern.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const contentStart = match.index + 1;
    const contentEnd = contentStart + match[1].length;
    if (pos >= contentStart && pos <= contentEnd) return true;
  }

  return false;
}

function isFormatActive(
  text: string,
  start: number,
  end: number,
  kind: TextFormatKind
): boolean {
  if (kind === 'bold') {
    return BOLD_VARIANTS.some(({ open, close }) =>
      start !== end
        ? isSelectionWrapped(text, start, end, open, close)
        : isInsideWrapper(text, start, open, close)
    );
  }

  if (kind === 'italic') {
    if (start !== end) {
      return (
        isSingleDelimiterWrapped(text, start, end, '_') ||
        isSingleDelimiterWrapped(text, start, end, '*')
      );
    }
    return (
      isInsideSingleDelimiterWrapper(text, start, '_') ||
      isInsideSingleDelimiterWrapper(text, start, '*')
    );
  }

  const wrappers = SIMPLE_WRAPPERS[kind];
  return wrappers.some(({ open, close }) =>
    start !== end
      ? isSelectionWrapped(text, start, end, open, close)
      : isInsideWrapper(text, start, open, close)
  );
}

function unwrapSelection(
  text: string,
  start: number,
  end: number,
  open: string,
  close: string
): { value: string; selectStart: number; selectEnd: number } {
  const value =
    text.slice(0, start - open.length) +
    text.slice(start, end) +
    text.slice(end + close.length);
  return {
    value,
    selectStart: start - open.length,
    selectEnd: end - open.length,
  };
}

export function getActiveTextFormats(
  text: string,
  selectionStart: number,
  selectionEnd: number
): Record<TextFormatKind, boolean> {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);

  return {
    bold: isFormatActive(text, start, end, 'bold'),
    italic: isFormatActive(text, start, end, 'italic'),
    underline: isFormatActive(text, start, end, 'underline'),
    strike: isFormatActive(text, start, end, 'strike'),
  };
}

export function toggleTextFormat(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  kind: TextFormatKind
): { value: string; selectStart: number; selectEnd: number } {
  let start = Math.min(selectionStart, selectionEnd);
  let end = Math.max(selectionStart, selectionEnd);

  if (start === end) {
    const word = expandToWord(text, start);
    start = word.start;
    end = word.end;
  }

  if (kind === 'bold') {
    for (const { open, close } of BOLD_VARIANTS) {
      if (isSelectionWrapped(text, start, end, open, close)) {
        const unwrapped = unwrapSelection(text, start, end, open, close);
        return canonicalizeMarkdownMarkers(unwrapped.value) === unwrapped.value
          ? unwrapped
          : {
              ...unwrapped,
              value: canonicalizeMarkdownMarkers(unwrapped.value),
            };
      }
    }
  }

  if (kind === 'italic') {
    for (const delimiter of ['_', '*'] as const) {
      if (isSingleDelimiterWrapped(text, start, end, delimiter)) {
        return unwrapSelection(text, start, end, delimiter, delimiter);
      }
    }
  }

  if (kind === 'underline' || kind === 'strike') {
    for (const { open, close } of SIMPLE_WRAPPERS[kind]) {
      if (isSelectionWrapped(text, start, end, open, close)) {
        return unwrapSelection(text, start, end, open, close);
      }
    }
  }

  const { before, after, sample } = TEXT_FORMAT_MARKERS[kind];
  const selected = text.slice(start, end) || sample;
  const value = text.slice(0, start) + before + selected + after + text.slice(end);
  return {
    value,
    selectStart: start + before.length,
    selectEnd: start + before.length + selected.length,
  };
}

export function insertAtCursor(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  insertion: string
): { value: string; selectStart: number; selectEnd: number } {
  const value = text.slice(0, selectionStart) + insertion + text.slice(selectionEnd);
  const pos = selectionStart + insertion.length;
  return { value, selectStart: pos, selectEnd: pos };
}
