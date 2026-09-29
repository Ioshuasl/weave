import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  filterExpressionSuggestions,
  flattenExpressionSuggestions,
  type ExpressionSuggestionGroup,
} from '../../../expression/domain';

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape']);

function moveSuggestionIndex(current: number, direction: 1 | -1, total: number): number {
  if (total === 0) return 0;
  return Math.max(0, Math.min(total - 1, current + direction));
}

export function useExpressionAutocomplete({
  enabled,
  suggestions,
}: {
  enabled: boolean;
  suggestions: ExpressionSuggestionGroup[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const openRef = useRef(false);
  const lastQueryRef = useRef('');
  const highlightedIndexRef = useRef(0);
  const triggerRef = useRef<{ query: string } | null>(null);

  const filteredGroups = useMemo(
    () => filterExpressionSuggestions(suggestions, query),
    [query, suggestions]
  );

  const flatSuggestions = useMemo(
    () => flattenExpressionSuggestions(filteredGroups),
    [filteredGroups]
  );

  const flatSuggestionsRef = useRef(flatSuggestions);
  flatSuggestionsRef.current = flatSuggestions;

  const close = useCallback(() => {
    openRef.current = false;
    lastQueryRef.current = '';
    triggerRef.current = null;
    setOpen(false);
    setQuery('');
    setHighlightedIndex(0);
    highlightedIndexRef.current = 0;
    setAnchorRect(null);
  }, []);

  const openWithTrigger = useCallback(
    (nextQuery: string, nextAnchor: DOMRect | null) => {
      if (!enabled || suggestions.length === 0) {
        close();
        return;
      }

      const wasOpen = openRef.current;
      const queryChanged = lastQueryRef.current !== nextQuery;
      lastQueryRef.current = nextQuery;
      triggerRef.current = { query: nextQuery };

      openRef.current = true;
      setOpen(true);
      setQuery(nextQuery);
      setAnchorRect(nextAnchor);

      if (!wasOpen || queryChanged) {
        highlightedIndexRef.current = 0;
        setHighlightedIndex(0);
      }
    },
    [close, enabled, suggestions.length]
  );

  const moveHighlight = useCallback((direction: 1 | -1) => {
    const total = flatSuggestionsRef.current.length;
    setHighlightedIndex((current) => {
      const next = moveSuggestionIndex(current, direction, total);
      highlightedIndexRef.current = next;
      return next;
    });
  }, []);

  const getHighlightedToken = useCallback((): string | null => {
    return flatSuggestionsRef.current[highlightedIndexRef.current]?.token ?? null;
  }, []);

  const handleNavigationKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!openRef.current) return false;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        moveHighlight(1);
        return true;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        moveHighlight(-1);
        return true;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        const token = getHighlightedToken();
        if (token) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }

      return false;
    },
    [close, getHighlightedToken, moveHighlight]
  );

  const isNavigationKey = useCallback((key: string) => NAVIGATION_KEYS.has(key), []);

  const shouldConsumeNavigationKeyUp = useCallback(
    (key: string) => openRef.current && NAVIGATION_KEYS.has(key),
    []
  );

  useEffect(() => {
    if (!enabled) close();
  }, [close, enabled]);

  useEffect(() => {
    if (highlightedIndexRef.current >= flatSuggestions.length) {
      const next = Math.max(0, flatSuggestions.length - 1);
      highlightedIndexRef.current = next;
      setHighlightedIndex(next);
    }
  }, [flatSuggestions]);

  return {
    open,
    query,
    highlightedIndex,
    anchorRect,
    filteredGroups,
    openRef,
    triggerRef,
    openWithTrigger,
    close,
    setHighlightedIndex: (index: number) => {
      highlightedIndexRef.current = index;
      setHighlightedIndex(index);
    },
    setAnchorRect,
    handleNavigationKeyDown,
    isNavigationKey,
    shouldConsumeNavigationKeyUp,
    getHighlightedToken,
    closeAfterBlur: close,
  };
}
