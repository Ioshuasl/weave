import React, { useCallback, useRef, useState } from 'react';
import { ClipboardPaste, Copy, Layout, Paintbrush, Trash2, Type } from 'lucide-react';
import type { ReportComponent } from '../../../types/report';
import type { DataFieldOption } from '../../../utils/reportUtils';
import type { DataSourceCatalog } from '../../../utils/dataSourceUtils';
import {
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyNumberInput,
  PropertySegmentedControl,
  PropertyTextarea,
  PropertyTextInput,
} from '../PropertyFields';
import { TextContentField } from '../TextContentField';
import { TablePropertiesSection } from '../TablePropertiesSection';
import type { RichTextEditorHandle } from '../RichTextEditor';
import { pushRecentFieldToken } from '../../../utils/fieldRecentStorage';
import { PropertyAccordion } from './PropertyAccordion';
import { FieldChipBar } from './FieldChipBar';
import { FieldTokenPicker } from './FieldTokenPicker';
import { ChartPropertiesSection } from './ChartPropertiesSection';
import { PropertyBorderInput, PropertyBorderRadiusInput } from './PropertyBorderInput';

export function TextComponentProperties({
  component,
  componentId,
  reportId,
  groupedDataFields,
  data,
  dataSourceCatalog,
  canPaste,
  onUpdate,
  onPatchStyle,
  onCopy,
  onDuplicate,
  onPaste,
  onRemove,
}: {
  component: ReportComponent;
  componentId: string;
  reportId: string;
  groupedDataFields: {
    singletons: DataFieldOption[];
    lists: DataFieldOption[];
    all: DataFieldOption[];
  };
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  canPaste: boolean;
  onUpdate: (updates: Partial<ReportComponent>) => void;
  onPatchStyle: (patch: React.CSSProperties) => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onPaste: () => void;
  onRemove: () => void;
}) {
  const editorHandleRef = useRef<RichTextEditorHandle | null>(null);
  const [recentVersion, setRecentVersion] = useState(0);

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

  return (
    <>
      <PropertyAccordion
        title="Conteúdo"
        icon={Type}
        sectionId="component-content"
        reportId={reportId}
        defaultOpen
      >
        {component.type === 'text' && (
          <>
            <TextContentField
              content={component.content}
              onContentChange={(content) => onUpdate({ content })}
              onEditorReady={(handle) => {
                editorHandleRef.current = handle;
              }}
              onFieldInserted={trackFieldInsert}
              data={data}
              dataSourceCatalog={dataSourceCatalog}
            />
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
          </>
        )}

        {component.type === 'image' && (
          <PropertyTextarea
            label="URL da imagem"
            value={component.content}
            onChange={(content) => onUpdate({ content })}
            placeholder="https://exemplo.com/imagem.png"
          />
        )}

        {component.type === 'table' && component.tableProps && (
          <TablePropertiesSection
            component={component}
            componentId={componentId}
            fieldOptions={groupedDataFields.lists}
            onUpdate={onUpdate}
          />
        )}

        {component.type === 'chart' && component.chartProps && (
          <ChartPropertiesSection
            componentId={componentId}
            chartProps={component.chartProps}
            data={data}
            dataSourceCatalog={dataSourceCatalog}
            onUpdate={onUpdate}
          />
        )}
      </PropertyAccordion>

      <PropertyAccordion
        title="Dimensões"
        icon={Layout}
        sectionId="component-dimensions"
        reportId={reportId}
        defaultOpen
        className="pt-2 border-t border-neutral-100"
      >
        <PropertyFieldGrid>
          <PropertyNumberInput
            label="X"
            suffix="px"
            value={Math.round(component.rect.x)}
            onChange={(x) => onUpdate({ rect: { ...component.rect, x } })}
          />
          <PropertyNumberInput
            label="Y"
            suffix="px"
            value={Math.round(component.rect.y)}
            onChange={(y) => onUpdate({ rect: { ...component.rect, y } })}
          />
          <PropertyNumberInput
            label="Largura"
            suffix="px"
            min={1}
            value={Math.round(component.rect.width)}
            onChange={(width) => onUpdate({ rect: { ...component.rect, width } })}
          />
          <PropertyNumberInput
            label="Altura"
            suffix="px"
            min={1}
            value={Math.round(component.rect.height)}
            onChange={(height) => onUpdate({ rect: { ...component.rect, height } })}
          />
        </PropertyFieldGrid>
      </PropertyAccordion>

      <PropertyAccordion
        title="Aparência"
        icon={Paintbrush}
        sectionId="component-appearance"
        reportId={reportId}
        defaultOpen={false}
        className="pt-2 border-t border-neutral-100"
      >
        {component.type === 'text' && (
          <>
            <PropertyFieldGrid>
              <PropertyTextInput
                label="Tamanho da fonte"
                value={String(component.style.fontSize || '14px')}
                onChange={(fontSize) => onUpdate({ style: { ...component.style, fontSize } })}
                placeholder="14px"
              />
              <PropertyColorInput
                label="Cor do texto"
                value={String(component.style.color || '#000000')}
                previewComponentId={componentId}
                previewStyleKey="color"
                onChange={(color) => onPatchStyle({ color })}
              />
            </PropertyFieldGrid>

            <PropertySegmentedControl
              label="Alinhamento"
              value={(component.style.textAlign as 'left' | 'center' | 'right') || 'left'}
              onChange={(textAlign) => onUpdate({ style: { ...component.style, textAlign } })}
              options={[
                { value: 'left', label: 'Esquerda' },
                { value: 'center', label: 'Centro' },
                { value: 'right', label: 'Direita' },
              ]}
            />
          </>
        )}

        {component.type === 'shape' && (
          <PropertyColorInput
            label="Cor de preenchimento"
            value={String(component.style.backgroundColor || '#e5e5e5')}
            previewComponentId={componentId}
            previewStyleKey="backgroundColor"
            onChange={(backgroundColor) => onPatchStyle({ backgroundColor })}
          />
        )}

        <PropertyBorderInput
          label="Borda"
          value={String(component.style.border || '')}
          onChange={(border) =>
            onUpdate({
              style: { ...component.style, border: border || undefined },
            })
          }
        />

        <PropertyBorderRadiusInput
          label="Cantos arredondados"
          value={String(component.style.borderRadius || '')}
          onChange={(borderRadius) =>
            onUpdate({
              style: { ...component.style, borderRadius: borderRadius || undefined },
            })
          }
        />

        <PropertyTextInput
          label="Espaçamento interno"
          value={String(component.style.padding || '')}
          onChange={(padding) => onUpdate({ style: { ...component.style, padding } })}
          placeholder="4px 8px"
        />
      </PropertyAccordion>

      <PropertyAccordion
        title="Ações"
        sectionId="component-actions"
        reportId={reportId}
        defaultOpen
        className="pt-2 border-t border-neutral-100"
      >
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopy}
              title="Copiar componente (Ctrl+C)"
              className="flex-1 min-w-0 flex items-center justify-center gap-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 px-2 py-2 rounded-md text-[13px] transition-colors border border-neutral-200"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Copiar</span>
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              title="Duplicar componente (Ctrl+D)"
              className="flex-1 min-w-0 flex items-center justify-center gap-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 px-2 py-2 rounded-md text-[13px] transition-colors border border-neutral-200"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Duplicar</span>
            </button>
          </div>
          {canPaste && (
            <button
              type="button"
              onClick={onPaste}
              className="w-full flex items-center justify-center gap-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-md text-[13px] transition-colors border border-neutral-200"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Colar na banda (Ctrl+V)
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="w-full flex items-center justify-center gap-1.5 hover:bg-red-50 text-neutral-500 hover:text-red-600 px-3 py-2 rounded-md text-[13px] transition-colors border border-transparent hover:border-red-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir componente
          </button>
        </div>
      </PropertyAccordion>
    </>
  );
}
