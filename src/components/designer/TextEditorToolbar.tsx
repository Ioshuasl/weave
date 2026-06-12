import React, { useCallback, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  type LucideIcon,
} from 'lucide-react';
import type { TextFormatKind } from '../../utils/richTextUtils';
import {
  FONT_SIZE_PRESETS,
  normalizeInlineColor,
  normalizeInlineFontSize,
  PADDING_PRESETS,
  type RichTextSelectionStyle,
} from '../../utils/richTextInlineStyle';
import type { RichTextEditorHandle } from './RichTextEditor';
import { cn } from '../../utils/cn';

type TextAlign = 'left' | 'center' | 'right';

function FormatToggleButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md border transition-colors shrink-0',
        active
          ? 'bg-neutral-900 text-white border-neutral-900'
          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900'
      )}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
    </button>
  );
}

function ToolbarSeparator() {
  return (
    <div
      className="w-px h-6 bg-neutral-200 mx-0.5 shrink-0 self-center"
      role="separator"
      aria-orientation="vertical"
    />
  );
}

const FORMAT_BUTTONS: { kind: TextFormatKind; label: string; icon: LucideIcon }[] = [
  { kind: 'bold', label: 'Negrito', icon: Bold },
  { kind: 'italic', label: 'Itálico', icon: Italic },
  { kind: 'underline', label: 'Sublinhado', icon: Underline },
  { kind: 'strike', label: 'Traçado', icon: Strikethrough },
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
  activeFormats,
  selectionStyle,
  onSelectionStyleChange,
  componentColor,
  onComponentColorChange,
  componentFontSize,
  onComponentFontSizeChange,
  textAlign,
  onTextAlignChange,
  padding,
  onPaddingChange,
}: {
  editorRef: React.RefObject<RichTextEditorHandle | null>;
  activeFormats: Record<TextFormatKind, boolean>;
  selectionStyle: RichTextSelectionStyle;
  onSelectionStyleChange: () => void;
  componentColor: string;
  onComponentColorChange: (color: string) => void;
  componentFontSize: string;
  onComponentFontSizeChange: (fontSize: string) => void;
  textAlign: TextAlign;
  onTextAlignChange: (textAlign: TextAlign) => void;
  padding: string;
  onPaddingChange: (padding: string) => void;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center gap-1 min-w-0 flex-wrap">
        {FORMAT_BUTTONS.map(({ kind, label, icon }) => (
          <React.Fragment key={kind}>
            <FormatToggleButton
              label={label}
              icon={icon}
              active={activeFormats[kind]}
              onClick={() => editorRef.current?.toggleFormat(kind)}
            />
          </React.Fragment>
        ))}

        <ToolbarSeparator />

        {ALIGN_BUTTONS.map(({ value, label, icon }) => (
          <React.Fragment key={value}>
            <FormatToggleButton
              label={label}
              icon={icon}
              active={textAlign === value}
              onClick={() => onTextAlignChange(value)}
            />
          </React.Fragment>
        ))}

        <ToolbarSeparator />

        <div className="relative shrink-0">
          <button
            type="button"
            title={
              colorTargetsSelection
                ? 'Cor do trecho selecionado'
                : selectionStyle.color === 'mixed'
                  ? 'Cores mistas na seleção'
                  : 'Cor padrão do componente'
            }
            aria-label="Cor do texto"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => colorInputRef.current?.click()}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-md border border-neutral-200',
              'hover:bg-neutral-50 hover:border-neutral-300 transition-colors'
            )}
          >
            <span
              className="w-4 h-4 rounded-sm border border-neutral-300/80"
              style={{
                backgroundColor:
                  selectionStyle.color === 'mixed' ? 'linear-gradient(135deg, #ccc 50%, #666 50%)' : displayColor,
                background:
                  selectionStyle.color === 'mixed'
                    ? 'linear-gradient(135deg, #d4d4d4 50%, #525252 50%)'
                    : displayColor,
              }}
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

        <select
          title={
            sizeTargetsSelection
              ? 'Tamanho do trecho selecionado'
              : selectionStyle.fontSize === 'mixed'
                ? 'Tamanhos mistos na seleção'
                : 'Tamanho padrão do componente'
          }
          aria-label="Tamanho da fonte"
          value={displayFontSize}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className={cn(
            'h-8 min-w-[4.25rem] max-w-[5.5rem] rounded-md border border-neutral-200',
            'bg-white px-1.5 text-[12px] text-neutral-700',
            'hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/8'
          )}
        >
          {selectionStyle.fontSize === 'mixed' && (
            <option value="" disabled>
              Misto
            </option>
          )}
          {FONT_SIZE_PRESETS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
          {displayFontSize &&
            !FONT_SIZE_PRESETS.includes(displayFontSize as (typeof FONT_SIZE_PRESETS)[number]) && (
              <option value={displayFontSize}>{displayFontSize}</option>
            )}
        </select>

        <ToolbarSeparator />

        <select
          title="Espaçamento interno do componente"
          aria-label="Espaçamento interno"
          value={
            padding === ''
              ? '0'
              : PADDING_PRESETS.includes(padding as (typeof PADDING_PRESETS)[number])
                ? padding
                : '__custom__'
          }
          onChange={(e) => {
            if (e.target.value !== '__custom__') {
              onPaddingChange(e.target.value === '0' ? '' : e.target.value);
            }
          }}
          className={cn(
            'h-8 min-w-[5.5rem] max-w-[7rem] rounded-md border border-neutral-200',
            'bg-white px-1.5 text-[12px] text-neutral-700',
            'hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/8'
          )}
        >
          <option value="0">Sem padding</option>
          {PADDING_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
          {!PADDING_PRESETS.includes(padding as (typeof PADDING_PRESETS)[number]) && padding && (
            <option value="__custom__">{padding}</option>
          )}
        </select>

        <input
          type="text"
          title="Espaçamento interno (CSS)"
          aria-label="Espaçamento interno personalizado"
          value={padding}
          onChange={(e) => onPaddingChange(e.target.value)}
          placeholder="4px 8px"
          className={cn(
            'h-8 w-[5.5rem] rounded-md border border-neutral-200 px-2',
            'text-[12px] text-neutral-700 placeholder:text-neutral-400',
            'hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/8'
          )}
        />
      </div>

      <p className="text-[10px] text-neutral-400 leading-snug">
        Cor e tamanho aplicam ao trecho selecionado; sem seleção, alteram o padrão do componente.
        Espaçamento interno vale para todo o bloco.
      </p>
    </div>
  );
}

export { EMPTY_FORMATS };
