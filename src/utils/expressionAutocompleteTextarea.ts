import { isValidExpressionQuery } from './expressionAutocompleteUtils';

export interface TextareaExpressionTrigger {
  query: string;
  replaceStart: number;
  replaceEnd: number;
}

export function getExpressionTriggerInTextarea(
  value: string,
  caret: number
): TextareaExpressionTrigger | null {
  const safeCaret = Math.max(0, Math.min(caret, value.length));
  const textBefore = value.slice(0, safeCaret);
  const braceIndex = textBefore.lastIndexOf('{');
  if (braceIndex < 0) return null;

  const query = textBefore.slice(braceIndex + 1);
  if (!isValidExpressionQuery(query)) return null;

  return {
    query,
    replaceStart: braceIndex,
    replaceEnd: safeCaret,
  };
}

export function replaceExpressionTriggerInTextarea(
  value: string,
  trigger: TextareaExpressionTrigger,
  token: string
): { nextValue: string; nextCaret: number } {
  const nextValue = value.slice(0, trigger.replaceStart) + token + value.slice(trigger.replaceEnd);
  const nextCaret = trigger.replaceStart + token.length;
  return { nextValue, nextCaret };
}

const MIRROR_STYLE_PROPS = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
] as const;

function escapeMirrorText(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Posição do caret no viewport — espelho off-screen com os mesmos estilos do textarea. */
export function getTextareaCaretClientRect(
  textarea: HTMLTextAreaElement,
  caret: number
): DOMRect | null {
  if (typeof document === 'undefined') return null;

  const safeCaret = Math.max(0, Math.min(caret, textarea.value.length));
  const computed = window.getComputedStyle(textarea);

  const mirror = document.createElement('div');
  mirror.setAttribute('aria-hidden', 'true');
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflow = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';

  for (const prop of MIRROR_STYLE_PROPS) {
    mirror.style.setProperty(prop, computed.getPropertyValue(prop));
  }

  mirror.style.width = `${textarea.clientWidth}px`;

  const textBefore = escapeMirrorText(textarea.value.slice(0, safeCaret));
  const textAfter = escapeMirrorText(textarea.value.slice(safeCaret));
  mirror.innerHTML = `${textBefore}<span data-caret-marker>\u200b</span>${textAfter}`;

  document.body.appendChild(mirror);

  const marker = mirror.querySelector<HTMLElement>('[data-caret-marker]');
  if (!marker) {
    mirror.remove();
    return null;
  }

  const textareaRect = textarea.getBoundingClientRect();
  const borderTop = parseFloat(computed.borderTopWidth || '0');
  const borderLeft = parseFloat(computed.borderLeftWidth || '0');
  const paddingTop = parseFloat(computed.paddingTop || '0');
  const paddingLeft = parseFloat(computed.paddingLeft || '0');
  const top =
    textareaRect.top +
    marker.offsetTop -
    textarea.scrollTop +
    borderTop +
    paddingTop;
  const left =
    textareaRect.left +
    marker.offsetLeft -
    textarea.scrollLeft +
    borderLeft +
    paddingLeft;
  const height = marker.offsetHeight || parseFloat(computed.lineHeight) || 16;

  mirror.remove();

  return new DOMRect(left, top, 0, height);
}
