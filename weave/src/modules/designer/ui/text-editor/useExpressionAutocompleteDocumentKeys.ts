import { useEffect } from 'react';
import type { useExpressionAutocomplete } from './useExpressionAutocomplete';

type AutocompleteApi = ReturnType<typeof useExpressionAutocomplete>;

/** Captura teclas de navegação do autocomplete no document (capture), com apply em Enter/Tab. */
export function useExpressionAutocompleteDocumentKeys({
  open,
  autocomplete,
  onApplyHighlighted,
  isEventTargetActive,
}: {
  open: boolean;
  autocomplete: AutocompleteApi;
  onApplyHighlighted: (token: string) => void;
  isEventTargetActive: (event: KeyboardEvent) => boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEventTargetActive(event)) return;
      if (!autocomplete.isNavigationKey(event.key)) return;

      if (autocomplete.handleNavigationKeyDown(event)) {
        if (event.key === 'Enter' || event.key === 'Tab') {
          const token = autocomplete.getHighlightedToken();
          if (token) onApplyHighlighted(token);
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [autocomplete, isEventTargetActive, onApplyHighlighted, open]);
}
