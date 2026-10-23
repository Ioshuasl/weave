import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { cn } from '../../../../shared/ui/cn';
import { getFieldChipDisplayLabel, getFieldChipTitle, type ExpressionSuggestionGroup } from '../../../expression/domain';
import { ExpressionAutocomplete } from './ExpressionAutocomplete';
import {
  getCaretClientRect,
  getExpressionTriggerAtCaret,
  replaceExpressionTriggerWithChip,
  replaceExpressionTriggerWithToken,
} from './expressionAutocompleteUtils';
import {
  applyFieldChipFormat,
  editorHtmlToMarkdown,
  insertFieldChipAtSelection,
  insertFieldTokenAtSelection,
  markdownToEditorHtml,
  previewFieldChipFormat,
  readFieldChipActiveFormats,
  type FieldChipLabelResolver,
} from './richTextEditorUtils';
import { applyInlineColorToSelection, applyInlineFontSizeToSelection, readRichTextSelectionStyle, type RichTextSelectionStyle } from './richTextSelectionStyle';
import { useExpressionAutocomplete } from './useExpressionAutocomplete';
import { useExpressionAutocompleteDocumentKeys } from './useExpressionAutocompleteDocumentKeys';
import type { TextFormatKind } from '../../../components/text/domain';
import type { DataSourceCatalog } from '../../../data-source/domain';

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
  /** Tipografia do componente aplicada ao conteúdo (fonte, altura da linha) */
  contentStyle?: React.CSSProperties;
  className?: string;
  minHeight?: string;
  id?: string;
  'aria-labelledby'?: string;
}

function readActiveFormats(root?: HTMLElement | null): Record<TextFormatKind, boolean> {
  const selection = window.getSelection();
  if (root && selection && selection.rangeCount > 0 && root.contains(selection.anchorNode)) {
    const chipFormats = readFieldChipActiveFormats(root, selection.getRangeAt(0));
    if (chipFormats) return chipFormats;
  }
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
      contentStyle,
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
    /** Última posição do cursor no editor — usada ao inserir campo clicando fora (ex.: lista de campos) */
    const lastRangeRef = useRef<Range | null>(null);
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
      onFormatsChange?.(readActiveFormats(editorRef.current));
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
          const editor = editorRef.current;
          editor?.focus();
          const selection = window.getSelection();
          const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          const chipPlan =
            editor && range && editor.contains(range.commonAncestorContainer)
              ? previewFieldChipFormat(editor, range, kind, document.queryCommandState(FORMAT_COMMANDS[kind]))
              : null;
          if (!chipPlan?.onlyChips) document.execCommand(FORMAT_COMMANDS[kind], false);
          if (editor && chipPlan) applyFieldChipFormat(editor, chipPlan.chips, kind, chipPlan.desired);
          emitChange();
          notifyFormats();
        },
        insertField: (token) => {
          const el = editorRef.current;
          if (!el) return;
          const wasFocused = document.activeElement === el;
          el.focus();
          const selection = window.getSelection();
          if (selection && !wasFocused) {
            const saved = lastRangeRef.current;
            const range =
              saved && el.contains(saved.commonAncestorContainer) ? saved : document.createRange();
            if (range !== saved) {
              range.selectNodeContents(el);
              range.collapse(false);
            }
            selection.removeAllRanges();
            selection.addRange(range);
          }
          if (fieldAsChips) {
            insertFieldChipAtSelection(token, getChipOptions(token));
          } else {
            insertFieldTokenAtSelection(token);
          }
          emitChange();
          notifyFormats();
        },
        getActiveFormats: () => readActiveFormats(editorRef.current),
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
            const selection = window.getSelection();
            const el = editorRef.current;
            if (el && selection?.rangeCount && el.contains(selection.getRangeAt(0).commonAncestorContainer)) {
              lastRangeRef.current = selection.getRangeAt(0).cloneRange();
            }
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
            'bg-weave-surface border border-neutral-200 rounded-md',
            'px-2.5 py-2 transition-[border-color,box-shadow]',
            'hover:border-neutral-300',
            'focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/8',
            'empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400 empty:before:pointer-events-none',
            '[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic',
            '[&_u]:underline [&_s]:line-through [&_strike]:line-through [&_del]:line-through',
            className
          )}
          style={{ ...contentStyle, minHeight }}
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
