import { canonicalizeMarkdownMarkers, escapeHtml, richTextToHtml } from '../../../components/text/domain';
import { serializeSpanInlineStyles } from './richTextSelectionStyle';

export interface FieldChipRenderOptions {
  displayLabel?: string;
  title?: string;
}

export type FieldChipLabelResolver = (token: string) => FieldChipRenderOptions | undefined;

function renderFieldChipHtml(token: string, resolver?: FieldChipLabelResolver): string {
  const resolved = resolver?.(token);
  const label = resolved?.displayLabel ?? token.slice(1, -1);
  const title = resolved?.title ?? token;
  return `<span data-field="${escapeHtml(token)}" class="rich-field-chip" contenteditable="false" title="${escapeHtml(title)}">${escapeHtml(label)}</span>`;
}

/** Markdown → HTML visual para contenteditable (campos viram chips) */
export function markdownToEditorHtml(
  content: string,
  resolveChip?: FieldChipLabelResolver,
  options?: { fieldAsChips?: boolean }
): string {
  if (!content) return '';

  if (options?.fieldAsChips === false) {
    return richTextToHtml(content);
  }

  // Chips entram depois da formatação/sanitização: `**{campo}**` continua em negrito.
  const chips: string[] = [];
  const html = richTextToHtml(
    content,
    (token) => `\uE001${chips.push(renderFieldChipHtml(token, resolveChip)) - 1}\uE001`
  );
  return html.replace(/\uE001(\d+)\uE001/g, (_, index: string) => chips[Number(index)]);
}

/** Marcadores de formatação não atravessam quebra de linha: cada linha recebe o seu par (`**a**\n**b**`). */
function wrapLines(text: string, open: string, close: string = open): string {
  return text
    .split('\n')
    .map((line) => {
      const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(line);
      if (!match || !match[2]) return line;
      return `${match[1]}${open}${match[2]}${close}${match[3]}`;
    })
    .join('\n');
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/\u00a0/g, ' ');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (el.dataset.field) {
    // formatação aplicada direto no campo (negrito/itálico/sublinhado/tachado inline)
    const { fontWeight, fontStyle, textDecoration } = el.style;
    let wrappedField = el.dataset.field;
    if (fontStyle === 'italic') wrappedField = `_${wrappedField}_`;
    if (fontWeight === 'bold' || fontWeight === '700' || Number(fontWeight) >= 600) {
      wrappedField = `**${wrappedField}**`;
    }
    if (textDecoration.includes('underline')) wrappedField = `++${wrappedField}++`;
    if (textDecoration.includes('line-through')) wrappedField = `~~${wrappedField}~~`;
    return wrappedField;
  }

  const inner = Array.from(el.childNodes).map(serializeNode).join('');

  switch (tag) {
    case 'strong':
    case 'b':
      return wrapLines(inner, '**');
    case 'em':
    case 'i':
      return wrapLines(inner, '_');
    case 'u':
      return wrapLines(inner, '++');
    case 's':
    case 'strike':
    case 'del':
      return wrapLines(inner, '~~');
    case 'br':
      return '\n';
    case 'div':
    case 'p':
      return inner.endsWith('\n') ? inner : `${inner}\n`;
    case 'span': {
      const { fontWeight, fontStyle, textDecoration } = el.style;
      let wrapped = inner;
      if (fontStyle === 'italic') wrapped = wrapLines(wrapped, '_');
      if (fontWeight === 'bold' || fontWeight === '700' || Number(fontWeight) >= 600) {
        wrapped = wrapLines(wrapped, '**');
      }
      if (textDecoration.includes('underline')) wrapped = wrapLines(wrapped, '++');
      if (textDecoration.includes('line-through')) wrapped = wrapLines(wrapped, '~~');
      return serializeSpanInlineStyles(el, wrapped);
    }
    default:
      return inner;
  }
}

/** HTML do contenteditable → markdown canônico */
export function editorHtmlToMarkdown(root: HTMLElement): string {
  const raw = Array.from(root.childNodes)
    .map(serializeNode)
    .join('')
    .replace(/\n+$/, '');

  if (!raw || raw === '\n') return '';
  return canonicalizeMarkdownMarkers(raw);
}

export function createFieldChipElement(
  token: string,
  options?: FieldChipRenderOptions
): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.dataset.field = token;
  chip.className = 'rich-field-chip';
  chip.contentEditable = 'false';
  chip.title = options?.title ?? token;
  chip.textContent = options?.displayLabel ?? token.slice(1, -1);
  return chip;
}

export function insertFieldChipAtSelection(
  token: string,
  options?: FieldChipRenderOptions
): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const chip = createFieldChipElement(token, options);
  range.insertNode(chip);

  const spacer = document.createTextNode('\u00a0');
  chip.after(spacer);

  range.setStartAfter(spacer);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function insertFieldTokenAtSelection(token: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(token);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function isEditorEmpty(root: HTMLElement): boolean {
  const text = (root.textContent ?? '').replace(/\u00a0/g, ' ').trim();
  if (text) return false;
  return !root.querySelector('[data-field]');
}

type FieldChipFormat = 'bold' | 'italic' | 'underline' | 'strike';

const FORMAT_TAGS: Record<FieldChipFormat, string[]> = {
  bold: ['STRONG', 'B'],
  italic: ['EM', 'I'],
  underline: ['U'],
  strike: ['S', 'STRIKE', 'DEL'],
};

function chipHasFormat(chip: HTMLElement, kind: FieldChipFormat, root: HTMLElement): boolean {
  const { fontWeight, fontStyle, textDecoration } = chip.style;
  if (kind === 'bold' && (fontWeight === 'bold' || Number(fontWeight) >= 600)) return true;
  if (kind === 'italic' && fontStyle === 'italic') return true;
  if (kind === 'underline' && textDecoration.includes('underline')) return true;
  if (kind === 'strike' && textDecoration.includes('line-through')) return true;
  for (let node = chip.parentElement; node && node !== root; node = node.parentElement) {
    if (FORMAT_TAGS[kind].includes(node.tagName)) return true;
  }
  return false;
}

function setChipFormat(chip: HTMLElement, kind: FieldChipFormat, on: boolean): void {
  if (kind === 'bold') chip.style.fontWeight = on ? '700' : '';
  if (kind === 'italic') chip.style.fontStyle = on ? 'italic' : '';
  if (kind === 'underline' || kind === 'strike') {
    const value = kind === 'underline' ? 'underline' : 'line-through';
    const parts = chip.style.textDecoration.split(/\s+/).filter((part) => part && part !== value);
    if (on) parts.push(value);
    chip.style.textDecoration = parts.join(' ');
  }
}

/** Tira o campo de dentro do elemento de formatação, partindo o elemento em antes / campo / depois. */
function liftChipOutOf(chip: HTMLElement, ancestor: HTMLElement): void {
  let top = chip as ChildNode;
  while (top.parentNode && top.parentNode !== ancestor) top = top.parentNode as unknown as ChildNode;
  const after = ancestor.cloneNode(false) as HTMLElement;
  let next = top.nextSibling;
  while (next) {
    const following = next.nextSibling;
    after.appendChild(next);
    next = following;
  }
  ancestor.after(top);
  if (after.childNodes.length > 0) top.after(after);
  if (ancestor.childNodes.length === 0) ancestor.remove();
}

/**
 * O campo é um ilha não editável: o `execCommand` ignora ele. Depois do comando aplicamos a formatação
 * direto nos campos da seleção (estilo inline no próprio campo; ao desligar, tira de dentro dos wrappers).
 * Devolve `true` quando a seleção só tinha campos (o comando nativo não teve efeito).
 */
export function previewFieldChipFormat(root: HTMLElement, range: Range, kind: FieldChipFormat, textStateBefore: boolean) {
  const chips = Array.from(root.querySelectorAll<HTMLElement>('[data-field]')).filter((chip) =>
    range.intersectsNode(chip)
  );
  if (chips.length === 0) return null;
  const fragment = range.cloneContents();
  fragment.querySelectorAll('[data-field]').forEach((node) => node.remove());
  const hasOtherText = (fragment.textContent ?? '').replace(/\u00a0/g, ' ').trim().length > 0;
  const desired = hasOtherText ? !textStateBefore : !chips.every((chip) => chipHasFormat(chip, kind, root));
  return { chips, desired, onlyChips: !hasOtherText };
}

export function applyFieldChipFormat(
  root: HTMLElement,
  chips: HTMLElement[],
  kind: FieldChipFormat,
  on: boolean
): void {
  chips.forEach((chip) => {
    if (on) {
      let inFormattedAncestor = false;
      for (let node = chip.parentElement; node && node !== root; node = node.parentElement) {
        if (FORMAT_TAGS[kind].includes(node.tagName)) inFormattedAncestor = true;
      }
      if (!inFormattedAncestor) setChipFormat(chip, kind, true);
      return;
    }
    setChipFormat(chip, kind, false);
    for (let node = chip.parentElement; node && node !== root; ) {
      const parent = node.parentElement;
      if (FORMAT_TAGS[kind].includes(node.tagName)) liftChipOutOf(chip, node);
      node = parent;
    }
  });
}

/** Estado dos botões B/I/U/S quando a seleção é só de campos (o `queryCommandState` ignora ilhas não editáveis). */
export function readFieldChipActiveFormats(
  root: HTMLElement,
  range: Range
): Record<FieldChipFormat, boolean> | null {
  const plan = previewFieldChipFormat(root, range, 'bold', false);
  if (!plan?.onlyChips) return null;
  const kinds: FieldChipFormat[] = ['bold', 'italic', 'underline', 'strike'];
  return Object.fromEntries(
    kinds.map((kind) => [kind, plan.chips.every((chip) => chipHasFormat(chip, kind, root))])
  ) as Record<FieldChipFormat, boolean>;
}
