import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  editorHtmlToMarkdown,
  insertFieldChipAtSelection,
  insertFieldTokenAtSelection,
  markdownToEditorHtml,
  type FieldChipLabelResolver,
} from './richTextEditorUtils';
import type { TextFormatKind } from '../../../components/text/domain';
import { applyInlineColorToSelection, applyInlineFontSizeToSelection, readRichTextSelectionStyle, type RichTextSelectionStyle } from './richTextSelectionStyle';
import type { DataSourceCatalog } from '../../../data-source/domain';
import { getFieldChipDisplayLabel, getFieldChipTitle, type ExpressionSuggestionGroup } from '../../../expression/domain';
import {
  getCaretClientRect,
  getExpressionTriggerAtCaret,
  replaceExpressionTriggerWithChip,
  replaceExpressionTriggerWithToken,
} from './expressionAutocompleteUtils';
import { useExpressionAutocomplete } from './useExpressionAutocomplete';
import { useExpressionAutocompleteDocumentKeys } from './useExpressionAutocompleteDocumentKeys';
import { ExpressionAutocomplete } from './ExpressionAutocomplete';
import { cn } from '../../../../shared/ui/cn';

const FORMAT_COMMANDS: Record<TextFormatKind, string> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strikeThrough',
};

export interface RichTextEditorHandle {
  focus: () => void;
  toggleFormat: (kind: TextFormatKind) => void;
  insertField: (token: string) => void;
  getActiveFormats: () => Record<TextFormatKind, boolean>;
  getSelectionStyle: () => RichTextSelectionStyle;
  applyInlineColor: (color: string) => boolean;
  applyInlineFontSize: (fontSize: string) => boolean;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onFormatsChange?: (formats: Record<TextFormatKind, boolean>) => void;
  onSelectionStyleChange?: (style: RichTextSelectionStyle) => void;
  expressionSuggestions?: ExpressionSuggestionGroup[];
  fieldPreviewContext?: {
    data: Record<string, unknown[]>;
    dataSourceCatalog?: DataSourceCatalog;
  };
  /** Quando false, tokens `{campo}` ficam como texto em vez de chips. */
  fieldAsChips?: boolean;
  onFieldInserted?: (token: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  id?: string;
  'aria-labelledby'?: string;
}

function readActiveFormats(): Record<TextFormatKind, boolean> {
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    strike: document.queryCommandState('strikeThrough'),
  };
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      value,
      onChange,
      onFormatsChange,
      onSelectionStyleChange,
      expressionSuggestions = [],
      fieldPreviewContext,
      fieldAsChips = true,
      onFieldInserted,
      placeholder,
      className,
      minHeight = '5rem',
      id,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    const resolveChipLabel = useCallback<FieldChipLabelResolver>(
      (token) => ({
        displayLabel: getFieldChipDisplayLabel(
          token,
          fieldPreviewContext?.data,
          fieldPreviewContext?.dataSourceCatalog
        ),
        title: getFieldChipTitle(
          token,
          fieldPreviewContext?.data,
          fieldPreviewContext?.dataSourceCatalog
        ),
      }),
      [fieldPreviewContext]
    );

    const getChipOptions = useCallback(
      (token: string) => resolveChipLabel(token),
      [resolveChipLabel]
    );

    const editorRef = useRef<HTMLDivElement>(null);
    const lastEmitted = useRef(value);
    const isFocused = useRef(false);
    const triggerRangeRef = useRef<Range | null>(null);

    const autocomplete = useExpressionAutocomplete({
      enabled: expressionSuggestions.length > 0,
      suggestions: expressionSuggestions,
    });

    const syncDomFromValue = useCallback(
      (markdown: string) => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = markdownToEditorHtml(
          markdown,
          fieldAsChips && fieldPreviewContext ? resolveChipLabel : undefined,
          { fieldAsChips }
        );
      },
      [fieldAsChips, fieldPreviewContext, resolveChipLabel]
    );

    const emitChange = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const markdown = editorHtmlToMarkdown(el);
      lastEmitted.current = markdown;
      onChange(markdown);
    }, [onChange]);

    const notifyFormats = useCallback(() => {
      onFormatsChange?.(readActiveFormats());
      const el = editorRef.current;
      if (el) {
        onSelectionStyleChange?.(readRichTextSelectionStyle(el));
      }
    }, [onFormatsChange, onSelectionStyleChange]);

    const syncAutocomplete = useCallback(() => {
      const el = editorRef.current;
      if (!el || expressionSuggestions.length === 0) {
        autocomplete.close();
        triggerRangeRef.current = null;
        return;
      }

      const trigger = getExpressionTriggerAtCaret(el);
      if (!trigger) {
        autocomplete.close();
        triggerRangeRef.current = null;
        return;
      }

      triggerRangeRef.current = trigger.range;
      autocomplete.openWithTrigger(trigger.query, getCaretClientRect());
    }, [autocomplete, expressionSuggestions.length]);

    const applySuggestion = useCallback(
      (token: string) => {
        const range = triggerRangeRef.current;
        if (fieldAsChips) {
          const chipOptions = getChipOptions(token);
          if (range) {
            replaceExpressionTriggerWithChip(range, token, chipOptions);
          } else {
            insertFieldChipAtSelection(token, chipOptions);
          }
        } else if (range) {
          replaceExpressionTriggerWithToken(range, token);
        } else {
          insertFieldTokenAtSelection(token);
        }
        autocomplete.close();
        triggerRangeRef.current = null;
        emitChange();
        notifyFormats();
        onFieldInserted?.(token);
        editorRef.current?.focus();
      },
      [
        autocomplete,
        emitChange,
        fieldAsChips,
        getChipOptions,
        notifyFormats,
        onFieldInserted,
      ]
    );

    const isAutocompleteTarget = useCallback((event: KeyboardEvent) => {
      const el = editorRef.current;
      if (!el) return false;
      const target = event.target as Node | null;
      return Boolean(target && el.contains(target));
    }, []);

    useExpressionAutocompleteDocumentKeys({
      open: autocomplete.open,
      autocomplete,
      onApplyHighlighted: applySuggestion,
      isEventTargetActive: isAutocompleteTarget,
    });

    useImperativeHandle(
      ref,
      () => ({
        focus: () => editorRef.current?.focus(),
        toggleFormat: (kind) => {
          editorRef.current?.focus();
          document.execCommand(FORMAT_COMMANDS[kind], false);
          emitChange();
          notifyFormats();
        },
        insertField: (token) => {
          editorRef.current?.focus();
          if (fieldAsChips) {
            insertFieldChipAtSelection(token, getChipOptions(token));
          } else {
            insertFieldTokenAtSelection(token);
          }
          emitChange();
          notifyFormats();
        },
        getActiveFormats: readActiveFormats,
        getSelectionStyle: () =>
          editorRef.current
            ? readRichTextSelectionStyle(editorRef.current)
            : { hasFocus: false, collapsed: true, color: null, fontSize: null },
        applyInlineColor: (color) => {
          const el = editorRef.current;
          if (!el) return false;
          el.focus();
          const applied = applyInlineColorToSelection(el, color);
          if (applied) {
            emitChange();
            notifyFormats();
          }
          return applied;
        },
        applyInlineFontSize: (fontSize) => {
          const el = editorRef.current;
          if (!el) return false;
          el.focus();
          const applied = applyInlineFontSizeToSelection(el, fontSize);
          if (applied) {
            emitChange();
            notifyFormats();
          }
          return applied;
        },
      }),
      [emitChange, fieldAsChips, getChipOptions, notifyFormats]
    );

    useEffect(() => {
      syncDomFromValue(value);
      lastEmitted.current = value;
    }, []);

    useEffect(() => {
      if (value === lastEmitted.current) return;
      if (isFocused.current) return;
      syncDomFromValue(value);
      lastEmitted.current = value;
    }, [value, syncDomFromValue]);

    useEffect(() => {
      const onSelectionChange = () => {
        const el = editorRef.current;
        if (!el) return;
        const selection = window.getSelection();
        if (!selection) return;
        const anchor = selection.anchorNode;
        if (!anchor || !el.contains(anchor)) return;
        notifyFormats();
      };

      document.addEventListener('selectionchange', onSelectionChange);
      return () => document.removeEventListener('selectionchange', onSelectionChange);
    }, [notifyFormats]);

    const handleInput = () => {
      emitChange();
      notifyFormats();
      syncAutocomplete();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      emitChange();
      syncAutocomplete();
    };

    return (
      <>
        <div
          ref={editorRef}
          id={id}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-labelledby={ariaLabelledBy}
          data-placeholder={placeholder}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => {
            isFocused.current = true;
            notifyFormats();
          }}
          onBlur={() => {
            isFocused.current = false;
            emitChange();
            window.setTimeout(() => autocomplete.closeAfterBlur(), 120);
          }}
          onKeyUp={(e) => {
            notifyFormats();
            if (autocomplete.shouldConsumeNavigationKeyUp(e.key)) {
              autocomplete.setAnchorRect(getCaretClientRect());
              return;
            }
            syncAutocomplete();
          }}
          onMouseUp={() => {
            notifyFormats();
            syncAutocomplete();
          }}
          className={cn(
            'rich-text-editor w-full max-w-full min-w-0 resize-y overflow-auto overflow-x-hidden',
            'text-[13px] text-neutral-900 leading-relaxed break-words [overflow-wrap:anywhere]',
            'bg-white border border-neutral-200 rounded-md',
            'px-2.5 py-2 transition-[border-color,box-shadow]',
            'hover:border-neutral-300',
            'focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/8',
            'empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400 empty:before:pointer-events-none',
            '[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic',
            '[&_u]:underline [&_s]:line-through [&_strike]:line-through [&_del]:line-through',
            '[&_.rich-field-chip]:inline-flex [&_.rich-field-chip]:items-center',
            '[&_.rich-field-chip]:px-1.5 [&_.rich-field-chip]:py-px [&_.rich-field-chip]:mx-0.5',
            '[&_.rich-field-chip]:rounded [&_.rich-field-chip]:border',
            '[&_.rich-field-chip]:border-indigo-200 [&_.rich-field-chip]:bg-indigo-50',
            '[&_.rich-field-chip]:text-[11px] [&_.rich-field-chip]:font-medium',
            '[&_.rich-field-chip]:text-indigo-700 [&_.rich-field-chip]:select-none',
            '[&_.rich-field-chip]:align-baseline',
            className
          )}
          style={{ minHeight }}
        />
        <ExpressionAutocomplete
          open={autocomplete.open}
          groups={autocomplete.filteredGroups}
          query={autocomplete.query}
          highlightedIndex={autocomplete.highlightedIndex}
          anchorRect={autocomplete.anchorRect}
          onHighlight={autocomplete.setHighlightedIndex}
          onSelect={applySuggestion}
        />
      </>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
