import React, { useCallback, useEffect, useRef } from 'react';
import { useExpressionAutocomplete } from '../../hooks/useExpressionAutocomplete';
import { useExpressionAutocompleteDocumentKeys } from '../../hooks/useExpressionAutocompleteDocumentKeys';
import type { ExpressionSuggestionGroup } from '../../utils/expressionFieldSuggestions';
import {
  getExpressionTriggerInTextarea,
  getTextareaCaretClientRect,
  replaceExpressionTriggerInTextarea,
  type TextareaExpressionTrigger,
} from '../../utils/expressionAutocompleteTextarea';
import { cn } from '../../utils/cn';
import { ExpressionAutocomplete } from './properties/ExpressionAutocomplete';

interface InlineTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  className?: string;
  style?: React.CSSProperties;
  expressionSuggestions?: ExpressionSuggestionGroup[];
  onFieldInserted?: (token: string) => void;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  value,
  onChange,
  onCommit,
  onCancel,
  className,
  style,
  expressionSuggestions = [],
  onFieldInserted,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const commitOnBlurRef = useRef(true);
  const triggerRef = useRef<TextareaExpressionTrigger | null>(null);

  const autocomplete = useExpressionAutocomplete({
    enabled: expressionSuggestions.length > 0,
    suggestions: expressionSuggestions,
  });

  const syncAutocomplete = useCallback(() => {
    const el = ref.current;
    if (!el || expressionSuggestions.length === 0) {
      autocomplete.close();
      triggerRef.current = null;
      return;
    }

    const trigger = getExpressionTriggerInTextarea(el.value, el.selectionStart ?? 0);
    if (!trigger) {
      autocomplete.close();
      triggerRef.current = null;
      return;
    }

    triggerRef.current = trigger;
    autocomplete.openWithTrigger(trigger.query, getTextareaCaretClientRect(el, trigger.replaceEnd));
  }, [autocomplete, expressionSuggestions.length]);

  const applySuggestion = useCallback(
    (token: string) => {
      const el = ref.current;
      const trigger = triggerRef.current;
      if (!el || !trigger) return;

      const { nextValue, nextCaret } = replaceExpressionTriggerInTextarea(el.value, trigger, token);
      onChange(nextValue);
      autocomplete.close();
      triggerRef.current = null;
      onFieldInserted?.(token);

      requestAnimationFrame(() => {
        const textarea = ref.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(nextCaret, nextCaret);
      });
    },
    [autocomplete, onChange, onFieldInserted]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, []);

  useExpressionAutocompleteDocumentKeys({
    open: autocomplete.open,
    autocomplete,
    onApplyHighlighted: applySuggestion,
    isEventTargetActive: (event) => event.target === ref.current,
  });

  const handleBlur = () => {
    window.setTimeout(() => {
      autocomplete.closeAfterBlur();
      if (commitOnBlurRef.current) {
        onCommit();
      }
    }, 120);
  };

  return (
    <>
      <textarea
        ref={ref}
        className={cn(
          'inline-text-editor hide-scrollbar no-drag w-full h-full resize-none',
          'bg-white/95 border border-neutral-300 rounded-sm',
          'px-1 py-0.5 outline-none focus:ring-1 focus:ring-neutral-400 text-inherit font-inherit',
          className
        )}
        style={{
          ...style,
          display: 'block',
          alignItems: undefined,
          justifyContent: undefined,
          whiteSpace: 'pre-wrap',
        }}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          syncAutocomplete();
        }}
        onBlur={handleBlur}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onScroll={() => {
          if (autocomplete.openRef.current) {
            const el = ref.current;
            const trigger = triggerRef.current;
            if (el && trigger) {
              autocomplete.setAnchorRect(
                getTextareaCaretClientRect(el, trigger.replaceEnd)
              );
            }
          }
        }}
        onKeyDown={(e) => {
          e.stopPropagation();

          if (e.key === 'Escape') {
            e.preventDefault();
            if (autocomplete.openRef.current) {
              autocomplete.close();
              triggerRef.current = null;
              return;
            }
            commitOnBlurRef.current = false;
            onCancel();
            return;
          }

          if (autocomplete.openRef.current && autocomplete.isNavigationKey(e.key)) {
            return;
          }

          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onCommit();
          }
        }}
        onKeyUp={(e) => {
          if (autocomplete.shouldConsumeNavigationKeyUp(e.key)) {
            const el = ref.current;
            const trigger = triggerRef.current;
            if (el && trigger) {
              autocomplete.setAnchorRect(
                getTextareaCaretClientRect(el, trigger.replaceEnd)
              );
            }
            return;
          }
          syncAutocomplete();
        }}
        onMouseUp={syncAutocomplete}
        placeholder="Digite { para inserir campo…"
      />
      <ExpressionAutocomplete
        open={autocomplete.open}
        groups={autocomplete.filteredGroups}
        query={autocomplete.query}
        highlightedIndex={autocomplete.highlightedIndex}
        anchorRect={autocomplete.anchorRect}
        onHighlight={autocomplete.setHighlightedIndex}
        onSelect={(token) => {
          commitOnBlurRef.current = false;
          applySuggestion(token);
          requestAnimationFrame(() => {
            commitOnBlurRef.current = true;
            ref.current?.focus();
          });
        }}
      />
    </>
  );
};
