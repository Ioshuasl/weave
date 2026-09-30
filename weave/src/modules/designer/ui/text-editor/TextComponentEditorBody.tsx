import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { type DataFieldOption, buildExpressionFieldSuggestions } from '../../../expression/domain';
import type { DataSourceCatalog } from '../../../data-source/domain';
import type { RichTextSelectionStyle } from './richTextSelectionStyle';
import { PropertyHint } from '../properties/controls/PropertyFields';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor';
import { TextEditorToolbar, EMPTY_FORMATS } from './TextEditorToolbar';
import { FieldChipBar } from '../field-picker/FieldChipBar';
import { FieldTokenPicker } from '../field-picker/FieldTokenPicker';
import { cn } from '../../../../shared/ui/cn';
import { useDesignerServices } from '../services/DesignerServicesContext';

type TextAlign = 'left' | 'center' | 'right';

const EMPTY_SELECTION_STYLE: RichTextSelectionStyle = {
  hasFocus: false,
  collapsed: true,
  color: null,
  fontSize: null,
};

export interface TextComponentEditorBodyProps {
  content: string;
  onContentChange: (content: string) => void;
  fontSize: string;
  onFontSizeChange: (fontSize: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  textAlign: TextAlign;
  onTextAlignChange: (textAlign: TextAlign) => void;
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  reportId: string;
  groupedDataFields: {
    singletons: DataFieldOption[];
    lists: DataFieldOption[];
  };
  onEditorReady?: (handle: RichTextEditorHandle | null) => void;
  editorMinHeight?: string;
  placeholder?: string;
}

export function TextComponentEditorBody({
  content,
  onContentChange,
  fontSize,
  onFontSizeChange,
  color,
  onColorChange,
  textAlign,
  onTextAlignChange,
  data,
  dataSourceCatalog,
  reportId,
  groupedDataFields,
  onEditorReady,
  editorMinHeight = '5rem',
  placeholder,
}: TextComponentEditorBodyProps) {
  const editorHandleRef = useRef<RichTextEditorHandle | null>(null);
  const editorId = useId();
  const editorLabelId = useId();
  const [recentVersion, setRecentVersion] = useState(0);
  const [activeFormats, setActiveFormats] =
    useState<typeof EMPTY_FORMATS>(EMPTY_FORMATS);
  const [selectionStyle, setSelectionStyle] =
    useState<RichTextSelectionStyle>(EMPTY_SELECTION_STYLE);

  const expressionSuggestions = useMemo(
    () =>
      buildExpressionFieldSuggestions(data, dataSourceCatalog, {
        includePreview: false,
      }),
    [data, dataSourceCatalog]
  );

  const { recentFields } = useDesignerServices();

  const trackFieldInsert = useCallback(
    (token: string) => {
      recentFields.push(token, reportId);
      setRecentVersion((version) => version + 1);
    },
    [recentFields, reportId]
  );

  const insertFieldAtCursor = useCallback(
    (token: string) => {
      editorHandleRef.current?.insertField(token);
      trackFieldInsert(token);
    },
    [trackFieldInsert]
  );

  const refreshSelectionStyle = useCallback(() => {
    const style = editorHandleRef.current?.getSelectionStyle();
    if (style) setSelectionStyle(style);
  }, []);

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      <div className="min-w-0 max-w-full">
        <label
          id={editorLabelId}
          htmlFor={editorId}
          className="block text-[11px] font-medium text-neutral-600 mb-1.5"
        >
          Texto
        </label>
        <div
          className={cn(
            'rounded-md border border-neutral-200 bg-white overflow-hidden',
            'transition-[border-color,box-shadow]',
            'focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/8'
          )}
        >
          <TextEditorToolbar
            editorRef={editorHandleRef}
            editorId={editorId}
            activeFormats={activeFormats}
            selectionStyle={selectionStyle}
            onSelectionStyleChange={refreshSelectionStyle}
            componentColor={color}
            onComponentColorChange={onColorChange}
            componentFontSize={fontSize}
            onComponentFontSizeChange={onFontSizeChange}
            textAlign={textAlign}
            onTextAlignChange={onTextAlignChange}
          />
          <RichTextEditor
            ref={(handle) => {
              editorHandleRef.current = handle;
              onEditorReady?.(handle);
            }}
            id={editorId}
            aria-labelledby={editorLabelId}
            value={content}
            onChange={onContentChange}
            onFormatsChange={setActiveFormats}
            onSelectionStyleChange={setSelectionStyle}
            expressionSuggestions={expressionSuggestions}
            fieldAsChips={false}
            onFieldInserted={trackFieldInsert}
            placeholder={placeholder}
            minHeight={editorMinHeight}
            className="border-0 rounded-none hover:border-transparent focus:border-transparent focus:ring-0"
          />
        </div>
        <PropertyHint className="mt-1.5">
          Digite {'{'} para inserir campos. Cor e tamanho aplicam à seleção; sem seleção, ao
          componente.
        </PropertyHint>
      </div>

      <FieldChipBar
        singletons={groupedDataFields.singletons}
        reportId={reportId}
        recentVersion={recentVersion}
        onInsert={insertFieldAtCursor}
      />

      <FieldTokenPicker
        singletons={groupedDataFields.singletons}
        lists={groupedDataFields.lists}
        onInsert={insertFieldAtCursor}
        reportId={reportId}
      />
    </div>
  );
}
