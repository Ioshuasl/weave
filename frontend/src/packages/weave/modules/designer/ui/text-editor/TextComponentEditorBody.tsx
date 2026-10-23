import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { cn } from '../../../../shared/ui/cn';
import { type DataFieldOption, buildExpressionFieldSuggestions } from '../../../expression/domain';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import { FieldChipBar } from '../field-picker/FieldChipBar';
import { FieldTokenPicker } from '../field-picker/FieldTokenPicker';
import { PropertyHint } from '../properties/controls/PropertyFields';
import { useDesignerServices } from '../services/DesignerServicesContext';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor';
import { TextEditorToolbar, EMPTY_FORMATS } from './TextEditorToolbar';
import type { RichTextSelectionStyle } from './richTextSelectionStyle';
import type { DataSourceCatalog } from '../../../data-source/domain';

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
  fontFamily: string;
  onFontFamilyChange: (fontFamily: string) => void;
  lineHeight: number;
  onLineHeightChange: (lineHeight: number) => void;
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
  fontFamily,
  onFontFamilyChange,
  lineHeight,
  onLineHeightChange,
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

  const calculos = useDesignerStore((state) => state.report.calculos);

  const expressionSuggestions = useMemo(
    () =>
      buildExpressionFieldSuggestions(data, dataSourceCatalog, {
        includePreview: false,
        calculos,
      }),
    [data, dataSourceCatalog, calculos]
  );

  const fieldPreviewContext = useMemo(() => ({ data, dataSourceCatalog }), [data, dataSourceCatalog]);

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
    <div className="flex h-full min-h-0 min-w-0">
      <section className="flex min-h-0 min-w-0 flex-[2] flex-col gap-1.5 p-4">
        <label
          id={editorLabelId}
          htmlFor={editorId}
          className="block shrink-0 text-[12px] font-medium text-neutral-700"
        >
          Texto
        </label>
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col rounded-md border border-neutral-200 bg-weave-surface overflow-hidden',
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
            fontFamily={fontFamily}
            onFontFamilyChange={onFontFamilyChange}
            lineHeight={lineHeight}
            onLineHeightChange={onLineHeightChange}
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
            fieldPreviewContext={fieldPreviewContext}
            onFieldInserted={trackFieldInsert}
            placeholder={placeholder}
            minHeight={editorMinHeight}
            contentStyle={{ fontFamily: fontFamily || undefined, lineHeight, textAlign }}
            className="flex-1 border-0 rounded-none resize-none text-[14px] hover:border-transparent focus:border-transparent focus:ring-0"
          />
        </div>
        <PropertyHint className="shrink-0">
          Digite {'{'} ou clique num campo ao lado para inseri-lo. Cor e tamanho aplicam à seleção;
          sem seleção, ao texto inteiro.
        </PropertyHint>
      </section>

      <aside
        aria-label="Campos de dados"
        className="flex min-h-0 w-[34%] min-w-[16rem] shrink-0 flex-col gap-3 border-l border-neutral-100 bg-neutral-50/70 p-4"
      >
        <h3 className="shrink-0 text-[13px] font-semibold text-neutral-800">Campos de dados</h3>
        <FieldChipBar
          singletons={groupedDataFields.singletons}
          reportId={reportId}
          recentVersion={recentVersion}
          onInsert={insertFieldAtCursor}
          wrap
        />
        <FieldTokenPicker
          singletons={groupedDataFields.singletons}
          lists={groupedDataFields.lists}
          onInsert={insertFieldAtCursor}
          reportId={reportId}
          variant="sidebar"
        />
      </aside>
    </div>
  );
}
