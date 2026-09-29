import { useCallback, useRef, useState, type KeyboardEvent } from 'react';

/**
 * Roving tabindex para `role="toolbar"` (WAI-ARIA APG):
 * um Tab stop no grupo; setas / Home / End movem o foco entre controles.
 * Em `<select>`, ↑↓ e Home/End ficam nativos; ←→ ainda navegam a toolbar.
 */
export function useRovingToolbarFocus(itemCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemsRef = useRef<Array<HTMLElement | null>>([]);

  const setItemRef = useCallback((index: number) => {
    return (element: HTMLElement | null) => {
      itemsRef.current[index] = element;
    };
  }, []);

  const moveFocus = useCallback(
    (index: number) => {
      if (itemCount <= 0) return;
      const next = ((index % itemCount) + itemCount) % itemCount;
      setActiveIndex(next);
      itemsRef.current[next]?.focus();
    },
    [itemCount]
  );

  const onToolbarKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      const onSelect = target?.tagName === 'SELECT';

      if (onSelect && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) return;
      if (onSelect && (event.key === 'Home' || event.key === 'End')) return;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          moveFocus(activeIndex + 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          moveFocus(activeIndex - 1);
          break;
        case 'Home':
          event.preventDefault();
          moveFocus(0);
          break;
        case 'End':
          event.preventDefault();
          moveFocus(itemCount - 1);
          break;
        default:
          break;
      }
    },
    [activeIndex, itemCount, moveFocus]
  );

  const getTabIndex = useCallback(
    (index: number) => (index === activeIndex ? 0 : -1),
    [activeIndex]
  );

  return { activeIndex, setActiveIndex, setItemRef, onToolbarKeyDown, getTabIndex };
}
