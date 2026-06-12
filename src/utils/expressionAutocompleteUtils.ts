import { createFieldChipElement, type FieldChipRenderOptions } from './richTextEditorUtils';

export const EXPRESSION_QUERY_RE = /^[a-zA-Z0-9_.#]*$/;

export function isValidExpressionQuery(query: string): boolean {
  return EXPRESSION_QUERY_RE.test(query);
}

function nodeTextLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').length;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (el.dataset.field) return el.dataset.field.length;
    if (el.tagName === 'BR') return 1;
  }
  return 0;
}

function serializeNodeToPlain(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/\u00a0/g, ' ');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  if (el.dataset.field) return el.dataset.field;
  if (el.tagName === 'BR') return '\n';
  return Array.from(el.childNodes).map(serializeNodeToPlain).join('');
}

export function getPlainTextBeforeCaret(root: HTMLElement): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return '';
  const caret = selection.getRangeAt(0);
  if (!root.contains(caret.startContainer)) return '';

  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(caret.endContainer, caret.endOffset);
  const fragment = range.cloneContents();
  return Array.from(fragment.childNodes).map(serializeNodeToPlain).join('');
}

export interface ExpressionTrigger {
  query: string;
  range: Range;
}

export function getExpressionTriggerAtCaret(root: HTMLElement): ExpressionTrigger | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return null;

  const caret = selection.getRangeAt(0);
  if (!root.contains(caret.startContainer)) return null;

  const textBefore = getPlainTextBeforeCaret(root);
  const braceIndex = textBefore.lastIndexOf('{');
  if (braceIndex < 0) return null;

  const query = textBefore.slice(braceIndex + 1);
  if (!isValidExpressionQuery(query)) return null;

  const startOffset = braceIndex;
  const triggerRange = rangeFromCharacterOffset(root, caret, startOffset);
  if (!triggerRange) return null;

  return { query, range: triggerRange };
}

function rangeFromCharacterOffset(
  root: HTMLElement,
  endRange: Range,
  startCharOffset: number
): Range | null {
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
    acceptNode(node) {
      if (node === root) return NodeFilter.FILTER_SKIP;
      if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.field) return NodeFilter.FILTER_ACCEPT;
        if (el.tagName === 'BR') return NodeFilter.FILTER_ACCEPT;
        if (el.childNodes.length === 0) return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  let offset = 0;
  let startNode: Node | null = null;
  let startOffset = 0;

  let current = walker.nextNode();
  while (current) {
    const len = nodeTextLength(current);
    if (offset + len > startCharOffset) {
      startNode = current;
      startOffset = startCharOffset - offset;
      break;
    }
    offset += len;
    current = walker.nextNode();
  }

  if (!startNode) return null;

  if (startNode.nodeType === Node.ELEMENT_NODE) {
    const el = startNode as HTMLElement;
    if (el.dataset.field) {
      range.setStartBefore(el);
    } else {
      range.setStart(startNode, 0);
    }
  } else {
    range.setStart(startNode, startOffset);
  }

  range.setEnd(endRange.endContainer, endRange.endOffset);
  return range;
}

export function replaceExpressionTriggerWithChip(
  triggerRange: Range,
  token: string,
  chipOptions?: FieldChipRenderOptions
): void {
  const selection = window.getSelection();
  if (!selection) return;

  triggerRange.deleteContents();

  const chip = createFieldChipElement(token, chipOptions);
  triggerRange.insertNode(chip);

  const spacer = document.createTextNode('\u00a0');
  chip.after(spacer);

  const after = document.createRange();
  after.setStartAfter(spacer);
  after.collapse(true);
  selection.removeAllRanges();
  selection.addRange(after);
}

export function getCaretClientRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);

  const rects = range.getClientRects();
  if (rects.length > 0) return rects[0];

  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  range.insertNode(marker);
  const rect = marker.getBoundingClientRect();
  marker.remove();
  return rect;
}
