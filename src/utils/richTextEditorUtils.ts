import {
  canonicalizeMarkdownMarkers,
  escapeHtml,
  richTextToHtml,
} from './richTextUtils';
import { serializeSpanInlineStyles } from './richTextInlineStyle';

const FIELD_TOKEN_RE = /\{[^}]+\}/g;

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

  const parts: string[] = [];
  let last = 0;
  const re = new RegExp(FIELD_TOKEN_RE.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    if (match.index > last) {
      parts.push(richTextToHtml(content.slice(last, match.index)));
    }
    const token = match[0];
    parts.push(renderFieldChipHtml(token, resolveChip));
    last = match.index + token.length;
  }

  if (last < content.length) {
    parts.push(richTextToHtml(content.slice(last)));
  }

  return parts.join('');
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/\u00a0/g, ' ');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (el.dataset.field) return el.dataset.field;

  const inner = Array.from(el.childNodes).map(serializeNode).join('');

  switch (tag) {
    case 'strong':
    case 'b':
      return `**${inner}**`;
    case 'em':
    case 'i':
      return `_${inner}_`;
    case 'u':
      return `++${inner}++`;
    case 's':
    case 'strike':
    case 'del':
      return `~~${inner}~~`;
    case 'br':
      return '\n';
    case 'div':
    case 'p':
      return inner.endsWith('\n') ? inner : `${inner}\n`;
    case 'span': {
      const { fontWeight, fontStyle, textDecoration } = el.style;
      let wrapped = inner;
      if (fontStyle === 'italic') wrapped = `_${wrapped}_`;
      if (fontWeight === 'bold' || fontWeight === '700' || Number(fontWeight) >= 600) {
        wrapped = `**${wrapped}**`;
      }
      if (textDecoration.includes('underline')) wrapped = `++${wrapped}++`;
      if (textDecoration.includes('line-through')) wrapped = `~~${wrapped}~~`;
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
