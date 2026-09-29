import React, { useMemo, useRef, useState } from 'react';
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
import type { TextFormatKind } from '../../../components/text/domain';
import type { DataSourceCatalog } from '../../../data-source/domain';
import { buildExpressionFieldSuggestions } from '../../../expression/domain';
import { PropertyHint } from '../properties/controls/PropertyFields';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor';
import { cn } from '../../../../shared/ui/cn';

type TextAlign = 'left' | 'center' | 'right';

interface TextContentFieldProps {
  content: string;
  onContentChange: (content: string) => void;
  onEditorReady?: (handle: RichTextEditorHandle | null) => void;
  onFieldInserted?: (token: string) => void;
  data?: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  placeholder?: string;
  textAlign?: TextAlign;
  onTextAlignChange?: (textAlign: TextAlign) => void;
  editorMinHeight?: string;
}

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

export const TextContentField: React.FC<TextContentFieldProps> = ({
  content,
  onContentChange,
  onEditorReady,
  onFieldInserted,
  data,
  dataSourceCatalog,
  placeholder = 'Digite o texto do relatório',
  textAlign = 'left',
  onTextAlignChange,
  editorMinHeight,
}) => {
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [activeFormats, setActiveFormats] =
    useState<Record<TextFormatKind, boolean>>(EMPTY_FORMATS);

  const expressionSuggestions = useMemo(() => {
    if (!data) return [];
    return buildExpressionFieldSuggestions(data, dataSourceCatalog);
  }, [data, dataSourceCatalog]);

  return (
    <div className="space-y-3 min-w-0 max-w-full">
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
        {onTextAlignChange && (
          <>
            <div
              className="w-px h-6 bg-neutral-200 mx-0.5 shrink-0"
              role="separator"
              aria-orientation="vertical"
            />
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
          </>
        )}
      </div>

      <div className="min-w-0 max-w-full">
        <label className="block text-[11px] font-medium text-neutral-600 mb-1">Texto</label>
        <RichTextEditor
          ref={(handle) => {
            editorRef.current = handle;
            onEditorReady?.(handle);
          }}
          value={content}
          onChange={onContentChange}
          onFormatsChange={setActiveFormats}
          expressionSuggestions={expressionSuggestions}
          fieldPreviewContext={
            data ? { data, dataSourceCatalog } : undefined
          }
          onFieldInserted={onFieldInserted}
          placeholder={placeholder}
          minHeight={editorMinHeight}
        />
        <PropertyHint className="mt-1">
          Digite {'{'} para inserir campos com auto-sugestão. Formatação visual; campos viram chips.
        </PropertyHint>
      </div>
    </div>
  );
};
