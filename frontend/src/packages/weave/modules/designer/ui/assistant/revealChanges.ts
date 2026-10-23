import type { ReportChanges } from '../../../assistant/domain';

const isScrollable = (el: HTMLElement) => /(auto|scroll)/.test(`${getComputedStyle(el).overflowY} ${getComputedStyle(el).overflowX}`);

const findScrollParent = (el: HTMLElement): HTMLElement | null => {
  for (let node = el.parentElement; node; node = node.parentElement) if (isScrollable(node) && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)) return node;
  return null;
};

/** Rola o canvas até o primeiro item alterado, SÓ se ele não estiver todo visível (se já está na tela, nada se mexe). */
export function revealFirstChange(root: ParentNode, changes: ReportChanges): void {
  const selector = [...changes.components.map((id) => `[data-component-id="${CSS.escape(id)}"]`), ...changes.bands.map((id) => `[data-band-id="${CSS.escape(id)}"]`)];
  const target = selector.map((s) => root.querySelector<HTMLElement>(s)).find(Boolean);
  if (!target) return;
  const scroller = findScrollParent(target);
  if (!scroller) return;
  const box = target.getBoundingClientRect();
  const view = scroller.getBoundingClientRect();
  const visible = box.top >= view.top && box.bottom <= view.bottom && box.left >= view.left && box.right <= view.right;
  if (!visible) target.scrollIntoView({ block: 'center', inline: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
