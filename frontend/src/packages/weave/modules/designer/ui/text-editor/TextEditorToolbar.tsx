import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Type,
  Underline,
  UnfoldVertical,
  type LucideIcon,
} from 'lucide-react';
import React, { useCallback, useRef } from 'react';
import { useRovingToolbarFocus } from '../../../../shared/hooks/useRovingToolbarFocus';
import { cn } from '../../../../shared/ui/cn';
import {
  TEXT_FONT_OPTIONS,
  TEXT_LINE_HEIGHT_OPTIONS,
  type TextFormatKind,
  normalizeInlineColor,
  normalizeInlineFontSize,
} from '../../../components/text/domain';
import { FONT_SIZE_PRESETS, type RichTextSelectionStyle } from './richTextSelectionStyle';
import type { RichTextEditorHandle } from './RichTextEditor';

type TextAlign = 'left' | 'center' | 'right';

const TOOLBAR_ITEM_COUNT = 11;

const SELECT_CLASS = cn(
  'h-9 rounded-md border border-neutral-200 bg-weave-surface px-2 text-[13px] text-neutral-700 cursor-pointer',
  'hover:border-neutral-300 hover:bg-neutral-50',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20'
);

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
  fontFamily,
  onFontFamilyChange,
  lineHeight,
  onLineHeightChange,
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
  fontFamily: string;
  onFontFamilyChange: (fontFamily: string) => void;
  lineHeight: number;
  onLineHeightChange: (lineHeight: number) => void;
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
      className="flex flex-nowrap items-center gap-0.5 min-w-0 overflow-x-auto hide-scrollbar px-1.5 py-1 bg-neutral-50/80 border-b border-neutral-100"
    >
      <div role="group" aria-label="Estilo do texto" className="flex shrink-0 items-center gap-0.5">
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

      <div role="group" aria-label="Alinhamento" className="flex shrink-0 items-center gap-0.5">
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

      <div role="group" aria-label="Fonte" className="flex shrink-0 flex-nowrap items-center gap-1">
        <select
          ref={setItemRef(7)}
          tabIndex={getTabIndex(7)}
          title="Fonte do texto"
          aria-label="Fonte do texto"
          value={fontFamily}
          onFocus={() => setActiveIndex(7)}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className={cn(SELECT_CLASS, 'w-[9.5rem]')}
          style={{ fontFamily: fontFamily || undefined }}
        >
          {TEXT_FONT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} style={{ fontFamily: option.value || undefined }}>
              {option.label}
            </option>
          ))}
          {!TEXT_FONT_OPTIONS.some((option) => option.value === fontFamily) && (
            <option value={fontFamily}>Personalizada</option>
          )}
        </select>

        <select
          ref={setItemRef(8)}
          tabIndex={getTabIndex(8)}
          title={sizeTitle}
          aria-label={sizeTitle}
          value={displayFontSize}
          onFocus={() => setActiveIndex(8)}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className={cn(SELECT_CLASS, 'w-[4.5rem]')}
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

        <label className="relative flex items-center" title="Altura da linha">
          <UnfoldVertical
            className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-neutral-500"
            aria-hidden
          />
          <select
            ref={setItemRef(9)}
            tabIndex={getTabIndex(9)}
            aria-label="Altura da linha"
            value={String(lineHeight)}
            onFocus={() => setActiveIndex(9)}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => onLineHeightChange(Number(e.target.value))}
            className={cn(SELECT_CLASS, 'w-[5.25rem] pl-7')}
          >
            {TEXT_LINE_HEIGHT_OPTIONS.map((value) => (
              <option key={value} value={String(value)}>
                {String(value).replace('.', ',')}
              </option>
            ))}
            {!TEXT_LINE_HEIGHT_OPTIONS.some((value) => value === lineHeight) && (
              <option value={String(lineHeight)}>{String(lineHeight).replace('.', ',')}</option>
            )}
          </select>
        </label>

        <div className="relative shrink-0">
          <button
            type="button"
            ref={setItemRef(10)}
            tabIndex={getTabIndex(10)}
            title={colorTitle}
            aria-label={`${colorTitle}. Abrir seletor de cor`}
            onFocus={() => setActiveIndex(10)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => colorInputRef.current?.click()}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-md border border-neutral-200 px-2 text-[13px] text-neutral-700',
              'hover:border-neutral-300 hover:bg-neutral-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20'
            )}
          >
            <Type className="h-4 w-4" strokeWidth={2} aria-hidden />
            <span
              className="h-4 w-4 rounded border border-neutral-300"
              style={{
                background:
                  selectionStyle.color === 'mixed'
                    ? 'linear-gradient(90deg, #d4d4d4 50%, #525252 50%)'
                    : displayColor,
              }}
              aria-hidden
            />
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
      </div>
    </div>
  );
}

export { EMPTY_FORMATS };
