import React, { useCallback, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Type,
  Underline,
  type LucideIcon,
} from 'lucide-react';
import type { TextFormatKind } from '../../utils/richTextUtils';
import {
  FONT_SIZE_PRESETS,
  normalizeInlineColor,
  normalizeInlineFontSize,
  type RichTextSelectionStyle,
} from '../../utils/richTextInlineStyle';
import { useRovingToolbarFocus } from '../../hooks/useRovingToolbarFocus';
import type { RichTextEditorHandle } from './RichTextEditor';
import { cn } from '../../utils/cn';

type TextAlign = 'left' | 'center' | 'right';

const TOOLBAR_ITEM_COUNT = 9;

function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac OS/.test(navigator.userAgent);
}

function shortcutText(ctrl: string, meta: string): string {
  return isApplePlatform() ? meta : ctrl;
}

const FORMAT_BUTTONS: {
  kind: TextFormatKind;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  ariaKeyshortcuts?: string;
}[] = [
  {
    kind: 'bold',
    label: 'Negrito',
    icon: Bold,
    shortcut: shortcutText('Ctrl+B', '⌘B'),
    ariaKeyshortcuts: shortcutText('Control+B', 'Meta+B'),
  },
  {
    kind: 'italic',
    label: 'Itálico',
    icon: Italic,
    shortcut: shortcutText('Ctrl+I', '⌘I'),
    ariaKeyshortcuts: shortcutText('Control+I', 'Meta+I'),
  },
  {
    kind: 'underline',
    label: 'Sublinhado',
    icon: Underline,
    shortcut: shortcutText('Ctrl+U', '⌘U'),
    ariaKeyshortcuts: shortcutText('Control+U', 'Meta+U'),
  },
  { kind: 'strike', label: 'Tachado', icon: Strikethrough },
];

const ALIGN_BUTTONS: { value: TextAlign; label: string; icon: LucideIcon }[] = [
  { value: 'left', label: 'Alinhar à esquerda', icon: AlignLeft },
  { value: 'center', label: 'Centralizar', icon: AlignCenter },
  { value: 'right', label: 'Alinhar à direita', icon: AlignRight },
];

const EMPTY_FORMATS: Record<TextFormatKind, boolean> = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
};

const ICON_BUTTON_CLASS = cn(
  'flex items-center justify-center size-9 rounded-md shrink-0',
  'text-neutral-600 transition-colors',
  'hover:bg-neutral-100 hover:text-neutral-900',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-0'
);

function ToolbarSeparator() {
  return (
    <div
      className="w-px h-5 bg-neutral-200 mx-1.5 shrink-0 self-center"
      role="separator"
      aria-orientation="vertical"
    />
  );
}

function resolveToolbarColor(
  selectionStyle: RichTextSelectionStyle,
  componentColor: string
): string {
  if (selectionStyle.color === 'mixed') return '#888888';
  if (selectionStyle.color) return selectionStyle.color;
  return normalizeInlineColor(componentColor || '#000000');
}

function resolveToolbarFontSize(
  selectionStyle: RichTextSelectionStyle,
  componentFontSize: string
): string {
  if (selectionStyle.fontSize === 'mixed') return '';
  if (selectionStyle.fontSize) return selectionStyle.fontSize;
  return normalizeInlineFontSize(componentFontSize || '14px');
}

export function TextEditorToolbar({
  editorRef,
  editorId,
  activeFormats,
  selectionStyle,
  onSelectionStyleChange,
  componentColor,
  onComponentColorChange,
  componentFontSize,
  onComponentFontSizeChange,
  textAlign,
  onTextAlignChange,
}: {
  editorRef: React.RefObject<RichTextEditorHandle | null>;
  editorId?: string;
  activeFormats: Record<TextFormatKind, boolean>;
  selectionStyle: RichTextSelectionStyle;
  onSelectionStyleChange: () => void;
  componentColor: string;
  onComponentColorChange: (color: string) => void;
  componentFontSize: string;
  onComponentFontSizeChange: (fontSize: string) => void;
  textAlign: TextAlign;
  onTextAlignChange: (textAlign: TextAlign) => void;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const { setActiveIndex, setItemRef, onToolbarKeyDown, getTabIndex } =
    useRovingToolbarFocus(TOOLBAR_ITEM_COUNT);

  const displayColor = resolveToolbarColor(selectionStyle, componentColor);
  const displayFontSize = resolveToolbarFontSize(selectionStyle, componentFontSize);
  const colorTargetsSelection =
    selectionStyle.hasFocus && !selectionStyle.collapsed && selectionStyle.color !== 'mixed';
  const sizeTargetsSelection =
    selectionStyle.hasFocus && !selectionStyle.collapsed && selectionStyle.fontSize !== 'mixed';

  const handleColorChange = useCallback(
    (raw: string) => {
      const normalized = normalizeInlineColor(raw);
      const editor = editorRef.current;
      if (editor && selectionStyle.hasFocus && !selectionStyle.collapsed) {
        if (editor.applyInlineColor(normalized)) {
          onSelectionStyleChange();
          return;
        }
      }
      onComponentColorChange(normalized);
    },
    [
      editorRef,
      onComponentColorChange,
      onSelectionStyleChange,
      selectionStyle.collapsed,
      selectionStyle.hasFocus,
    ]
  );

  const handleFontSizeChange = useCallback(
    (raw: string) => {
      const normalized = normalizeInlineFontSize(raw);
      const editor = editorRef.current;
      if (editor && selectionStyle.hasFocus && !selectionStyle.collapsed) {
        if (editor.applyInlineFontSize(normalized)) {
          onSelectionStyleChange();
          return;
        }
      }
      onComponentFontSizeChange(normalized);
    },
    [
      editorRef,
      onComponentFontSizeChange,
      onSelectionStyleChange,
      selectionStyle.collapsed,
      selectionStyle.hasFocus,
    ]
  );

  const colorTitle = colorTargetsSelection
    ? 'Cor do trecho selecionado'
    : selectionStyle.color === 'mixed'
      ? 'Cores mistas na seleção'
      : 'Cor padrão do componente';

  const sizeTitle = sizeTargetsSelection
    ? 'Tamanho do trecho selecionado'
    : selectionStyle.fontSize === 'mixed'
      ? 'Tamanhos mistos na seleção'
      : 'Tamanho padrão do componente';

  return (
    <div
      role="toolbar"
      aria-label="Formatação de texto"
      aria-orientation="horizontal"
      aria-controls={editorId}
      onKeyDown={onToolbarKeyDown}
      className="flex items-center gap-0.5 min-w-0 flex-wrap px-1.5 py-1 bg-neutral-50/80 border-b border-neutral-100"
    >
      <div role="group" aria-label="Estilo do texto" className="flex items-center gap-0.5">
        {FORMAT_BUTTONS.map(({ kind, label, icon: Icon, shortcut, ariaKeyshortcuts }, index) => {
          const name = shortcut ? `${label} (${shortcut})` : label;
          return (
            <button
              key={kind}
              type="button"
              ref={setItemRef(index)}
              tabIndex={getTabIndex(index)}
              title={name}
              aria-label={name}
              aria-pressed={activeFormats[kind]}
              aria-keyshortcuts={ariaKeyshortcuts}
              onFocus={() => setActiveIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editorRef.current?.toggleFormat(kind)}
              className={cn(ICON_BUTTON_CLASS, activeFormats[kind] && 'bg-neutral-200 text-neutral-900')}
            >
              <Icon className="w-4 h-4" strokeWidth={2} aria-hidden />
            </button>
          );
        })}
      </div>

      <ToolbarSeparator />

      <div role="group" aria-label="Alinhamento" className="flex items-center gap-0.5">
        {ALIGN_BUTTONS.map(({ value, label, icon: Icon }, offset) => {
          const index = 4 + offset;
          const active = textAlign === value;
          return (
            <button
              key={value}
              type="button"
              ref={setItemRef(index)}
              tabIndex={getTabIndex(index)}
              title={label}
              aria-label={label}
              aria-pressed={active}
              onFocus={() => setActiveIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onTextAlignChange(value)}
              className={cn(ICON_BUTTON_CLASS, active && 'bg-neutral-200 text-neutral-900')}
            >
              <Icon className="w-4 h-4" strokeWidth={2} aria-hidden />
            </button>
          );
        })}
      </div>

      <ToolbarSeparator />

      <div role="group" aria-label="Cor e tamanho" className="flex items-center gap-0.5">
        <div className="relative shrink-0">
          <button
            type="button"
            ref={setItemRef(7)}
            tabIndex={getTabIndex(7)}
            title={colorTitle}
            aria-label={`${colorTitle}. Abrir seletor de cor`}
            onFocus={() => setActiveIndex(7)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => colorInputRef.current?.click()}
            className={ICON_BUTTON_CLASS}
          >
            <span className="relative flex flex-col items-center justify-center" aria-hidden>
              <Type className="w-4 h-4" strokeWidth={2} />
              <span
                className="absolute -bottom-0.5 left-0.5 right-0.5 h-[3px] rounded-full"
                style={{
                  background:
                    selectionStyle.color === 'mixed'
                      ? 'linear-gradient(90deg, #d4d4d4 50%, #525252 50%)'
                      : displayColor,
                }}
              />
            </span>
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={displayColor.startsWith('#') ? displayColor : '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
        </div>

        <select
          ref={setItemRef(8)}
          tabIndex={getTabIndex(8)}
          title={sizeTitle}
          aria-label={sizeTitle}
          value={displayFontSize}
          onFocus={() => setActiveIndex(8)}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className={cn(
            'h-9 min-w-[4.75rem] max-w-[6rem] rounded-md border-0 bg-transparent',
            'px-1.5 text-[13px] text-neutral-700 cursor-pointer',
            'hover:bg-neutral-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20'
          )}
        >
          {selectionStyle.fontSize === 'mixed' && (
            <option value="" disabled>
              Misto
            </option>
          )}
          {FONT_SIZE_PRESETS.map((size) => (
            <option key={size} value={size}>
              {size.replace('px', '')}
            </option>
          ))}
          {displayFontSize &&
            !FONT_SIZE_PRESETS.includes(displayFontSize as (typeof FONT_SIZE_PRESETS)[number]) && (
              <option value={displayFontSize}>{displayFontSize.replace('px', '')}</option>
            )}
        </select>
      </div>
    </div>
  );
}

export { EMPTY_FORMATS };
