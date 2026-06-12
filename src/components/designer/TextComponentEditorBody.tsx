import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { DataFieldOption } from '../../utils/reportUtils';
import type { DataSourceCatalog } from '../../utils/dataSourceUtils';
import { pushRecentFieldToken } from '../../utils/fieldRecentStorage';
import { buildExpressionFieldSuggestions } from '../../utils/expressionFieldSuggestions';
import type { RichTextSelectionStyle } from '../../utils/richTextInlineStyle';
import { PropertyHint } from './PropertyFields';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor';
import { TextEditorToolbar, EMPTY_FORMATS } from './TextEditorToolbar';
import { FieldChipBar } from './properties/FieldChipBar';
import { FieldTokenPicker } from './properties/FieldTokenPicker';

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
  padding: string;
  onPaddingChange: (padding: string) => void;
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  reportId: string;
  groupedDataFields: {
    singletons: DataFieldOption[];
    lists: DataFieldOption[];
  };
  onEditorReady?: (handle: RichTextEditorHandle | null) => void;
  previewComponentId?: string;
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
  padding,
  onPaddingChange,
  data,
  dataSourceCatalog,
  reportId,
  groupedDataFields,
  onEditorReady,
  editorMinHeight = '5rem',
  placeholder,
}: TextComponentEditorBodyProps) {
  const editorHandleRef = useRef<RichTextEditorHandle | null>(null);
  const [recentVersion, setRecentVersion] = useState(0);
  const [activeFormats, setActiveFormats] =
    useState<typeof EMPTY_FORMATS>(EMPTY_FORMATS);
  const [selectionStyle, setSelectionStyle] =
    useState<RichTextSelectionStyle>(EMPTY_SELECTION_STYLE);

  const expressionSuggestions = useMemo(
    () => buildExpressionFieldSuggestions(data, dataSourceCatalog),
    [data, dataSourceCatalog]
  );

  const trackFieldInsert = useCallback(
    (token: string) => {
      pushRecentFieldToken(token, reportId);
      setRecentVersion((version) => version + 1);
    },
    [reportId]
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
      <TextEditorToolbar
        editorRef={editorHandleRef}
        activeFormats={activeFormats}
        selectionStyle={selectionStyle}
        onSelectionStyleChange={refreshSelectionStyle}
        componentColor={color}
        onComponentColorChange={onColorChange}
        componentFontSize={fontSize}
        onComponentFontSizeChange={onFontSizeChange}
        textAlign={textAlign}
        onTextAlignChange={onTextAlignChange}
        padding={padding}
        onPaddingChange={onPaddingChange}
      />

      <div className="min-w-0 max-w-full">
        <label className="block text-[11px] font-medium text-neutral-600 mb-1">Texto</label>
        <RichTextEditor
          ref={(handle) => {
            editorHandleRef.current = handle;
            onEditorReady?.(handle);
          }}
          value={content}
          onChange={onContentChange}
          onFormatsChange={setActiveFormats}
          onSelectionStyleChange={setSelectionStyle}
          expressionSuggestions={expressionSuggestions}
          fieldPreviewContext={{ data, dataSourceCatalog }}
          onFieldInserted={trackFieldInsert}
          placeholder={placeholder}
          minHeight={editorMinHeight}
        />
        <PropertyHint className="mt-1">
          Digite {'{'} para inserir campos com auto-sugestão. Formatação visual; campos viram chips.
        </PropertyHint>
      </div>

      <FieldChipBar
        singletons={groupedDataFields.singletons}
        data={data}
        dataSourceCatalog={dataSourceCatalog}
        reportId={reportId}
        recentVersion={recentVersion}
        onInsert={insertFieldAtCursor}
      />

      <FieldTokenPicker
        singletons={groupedDataFields.singletons}
        lists={groupedDataFields.lists}
        data={data}
        dataSourceCatalog={dataSourceCatalog}
        onInsert={insertFieldAtCursor}
        reportId={reportId}
      />
    </div>
  );
}
