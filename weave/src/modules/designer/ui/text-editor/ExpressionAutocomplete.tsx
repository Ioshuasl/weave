import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ExpressionSuggestionGroup } from '../../../expression/domain';
import { DESIGNER_MODAL_POPUP_Z } from '../../../../shared/ui/zIndex';
import { cn } from '../../../../shared/ui/cn';

const POPUP_WIDTH = 280;
const POPUP_MAX_HEIGHT = 256;
const VIEWPORT_PADDING = 8;
const ANCHOR_GAP = 4;

function resolvePopupPosition(anchorRect: DOMRect): { top: number; left: number } {
  const left = Math.min(
    Math.max(VIEWPORT_PADDING, anchorRect.left),
    window.innerWidth - POPUP_WIDTH - VIEWPORT_PADDING
  );

  const spaceBelow = window.innerHeight - anchorRect.bottom - ANCHOR_GAP;
  const spaceAbove = anchorRect.top - ANCHOR_GAP;
  const openBelow = spaceBelow >= POPUP_MAX_HEIGHT || spaceBelow >= spaceAbove;

  const top = openBelow
    ? anchorRect.bottom + ANCHOR_GAP
    : Math.max(VIEWPORT_PADDING, anchorRect.top - ANCHOR_GAP - POPUP_MAX_HEIGHT);

  return { top, left };
}

export function ExpressionAutocomplete({
  open,
  groups,
  query,
  highlightedIndex,
  anchorRect,
  onHighlight,
  onSelect,
}: {
  open: boolean;
  groups: ExpressionSuggestionGroup[];
  query: string;
  highlightedIndex: number;
  anchorRect: DOMRect | null;
  onHighlight: (index: number) => void;
  onSelect: (token: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open || !anchorRect) {
      setPosition(null);
      return;
    }
    setPosition(resolvePopupPosition(anchorRect));
  }, [open, anchorRect]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, open, groups]);

  if (!open || !position) return null;

  let flatIndex = -1;

  return createPortal(
    <div
      ref={listRef}
      role="listbox"
      aria-label="Campos disponíveis"
      className="fixed w-[280px] max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg"
      style={{ top: position.top, left: position.left, zIndex: DESIGNER_MODAL_POPUP_Z }}
    >
      {groups.length === 0 ? (
        <p className="px-3 py-2 text-[12px] text-neutral-400">
          Nenhum campo para &ldquo;{query}&rdquo;
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.id}>
            <div className="sticky top-0 z-10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-50/95 border-b border-neutral-100">
              {group.label}
            </div>
            {group.items.map((item) => {
              flatIndex += 1;
              const index = flatIndex;
              const active = index === highlightedIndex;
              return (
                <button
                  key={item.token}
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-active={active ? 'true' : undefined}
                  onMouseEnter={() => onHighlight(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(item.token)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono text-neutral-800 truncate">
                      {item.token}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">{item.label}</div>
                  </div>
                  {item.preview && (
                    <span className="shrink-0 text-[10px] text-neutral-500 max-w-[42%] truncate">
                      {item.preview}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>,
    document.body
  );
}
