import { normalizeInlineColor, normalizeInlineFontSize } from '../../../components/text/domain';

export type RichTextSelectionStyle = {
  hasFocus: boolean;
  collapsed: boolean;
  color: string | 'mixed' | null;
  fontSize: string | 'mixed' | null;
};

function readElementInlineColor(el: HTMLElement): string | null {
  if (el.style.color) return normalizeInlineColor(el.style.color);
  const dataColor = el.getAttribute('data-inline-color');
  if (dataColor) return normalizeInlineColor(dataColor);
  return null;
}

function readElementInlineFontSize(el: HTMLElement): string | null {
  if (el.style.fontSize) return normalizeInlineFontSize(el.style.fontSize);
  const dataSize = el.getAttribute('data-inline-size');
  if (dataSize) return normalizeInlineFontSize(dataSize);
  return null;
}

function findStyledAncestor(node: Node | null, root: HTMLElement): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== root) {
    if (current instanceof HTMLElement) {
      if (readElementInlineColor(current) || readElementInlineFontSize(current)) {
        return current;
      }
    }
    current = current.parentNode;
  }
  return null;
}

function readStyleAtPoint(
  root: HTMLElement,
  node: Node | null,
  offset: number
): { color: string | null; fontSize: string | null } {
  if (!node) return { color: null, fontSize: null };

  const range = document.createRange();
  try {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      range.setStart(node, Math.min(offset, len));
    } else if (node instanceof HTMLElement) {
      range.selectNodeContents(node);
      range.collapse(true);
    } else {
      return { color: null, fontSize: null };
    }
  } catch {
    return { color: null, fontSize: null };
  }

  const ancestor = findStyledAncestor(node, root);
  if (ancestor) {
    return {
      color: readElementInlineColor(ancestor),
      fontSize: readElementInlineFontSize(ancestor),
    };
  }

  return { color: null, fontSize: null };
}

export function readRichTextSelectionStyle(root: HTMLElement): RichTextSelectionStyle {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { hasFocus: false, collapsed: true, color: null, fontSize: null };
  }

  const anchor = selection.anchorNode;
  if (!anchor || !root.contains(anchor)) {
    return { hasFocus: false, collapsed: true, color: null, fontSize: null };
  }

  const collapsed = selection.isCollapsed;
  const start = readStyleAtPoint(root, selection.anchorNode, selection.anchorOffset);
  const end = collapsed
    ? start
    : readStyleAtPoint(root, selection.focusNode, selection.focusOffset);

  const color =
    start.color === end.color ? start.color : start.color == null && end.color == null ? null : 'mixed';
  const fontSize =
    start.fontSize === end.fontSize
      ? start.fontSize
      : start.fontSize == null && end.fontSize == null
        ? null
        : 'mixed';

  return { hasFocus: true, collapsed, color, fontSize };
}

function unwrapMatchingSpans(root: HTMLElement, match: (el: HTMLSpanElement) => boolean) {
  const spans = Array.from(root.querySelectorAll('span')).reverse();
  for (const span of spans) {
    if (!match(span as HTMLSpanElement)) continue;
    const parent = span.parentNode;
    if (!parent) continue;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    parent.removeChild(span);
  }
}

export function applyInlineColorToSelection(root: HTMLElement, color: string): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;

  const normalized = normalizeInlineColor(color);
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return false;

  root.focus();

  const span = document.createElement('span');
  span.style.color = normalized;
  span.dataset.inlineColor = normalized;

  try {
    range.surroundContents(span);
  } catch {
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  if (span.parentNode) {
    unwrapMatchingSpans(root, (el) => {
      const elColor = readElementInlineColor(el);
      return elColor === normalized && el !== span && !span.contains(el);
    });
  }

  selection.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(span);
  selection.addRange(next);
  return true;
}

export function applyInlineFontSizeToSelection(root: HTMLElement, fontSize: string): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;

  const normalized = normalizeInlineFontSize(fontSize);
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return false;

  root.focus();

  const span = document.createElement('span');
  span.style.fontSize = normalized;
  span.dataset.inlineSize = normalized;

  try {
    range.surroundContents(span);
  } catch {
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  selection.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(span);
  selection.addRange(next);
  return true;
}

export function serializeSpanInlineStyles(el: HTMLElement, inner: string): string {
  let wrapped = inner;
  const color = readElementInlineColor(el);
  const fontSize = readElementInlineFontSize(el);

  if (fontSize) {
    wrapped = `[size=${fontSize}]${wrapped}[/size]`;
  }
  if (color) {
    wrapped = `[color=${color}]${wrapped}[/color]`;
  }

  return wrapped;
}

export const FONT_SIZE_PRESETS = [
  '10px',
  '11px',
  '12px',
  '13px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
] as const;

export const PADDING_PRESETS = ['4px', '8px', '4px 8px', '8px 12px'] as const;
