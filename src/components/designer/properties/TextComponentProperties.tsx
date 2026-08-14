import React from 'react';
import { ClipboardPaste, Copy, Layout, Paintbrush, Trash2, Type } from 'lucide-react';
import type { ReportComponent } from '../../../types/report';
import type { DataFieldOption } from '../../../utils/reportUtils';
import type { DataSourceCatalog } from '../../../utils/dataSourceUtils';
import {
  PropertyCheckbox,
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertyTextInput,
} from '../PropertyFields';
import { TextComponentContentSummary } from './TextComponentContentSummary';
import { TablePropertiesSection } from '../TablePropertiesSection';
import { PropertyAccordion } from './PropertyAccordion';
import { ChartPropertiesSection } from './ChartPropertiesSection';
import { ImagePropertiesSection } from './ImagePropertiesSection';
import { QrPropertiesSection } from './QrPropertiesSection';
import { PropertyBorderInput, PropertyBorderRadiusInput } from './PropertyBorderInput';
import { applyRectSizeWithAspect } from '../../../utils/imagePropsUtils';
import { QR_MIN_SIZE } from '../../../utils/componentRectDefaults';

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
  const lockAspect =
    (component.type === 'image' && Boolean(component.imageProps?.lockAspectRatio)) ||
    component.type === 'qr';
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
          <TextComponentContentSummary
            component={component}
            componentId={componentId}
          />
        )}

        {component.type === 'image' && (
          <ImagePropertiesSection
            component={component}
            reportId={reportId}
            groupedDataFields={groupedDataFields}
            data={data}
            dataSourceCatalog={dataSourceCatalog}
            onUpdate={onUpdate}
          />
        )}

        {component.type === 'qr' && (
          <QrPropertiesSection
            component={component}
            reportId={reportId}
            groupedDataFields={groupedDataFields}
            data={data}
            dataSourceCatalog={dataSourceCatalog}
            onUpdate={onUpdate}
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
            min={component.type === 'qr' ? QR_MIN_SIZE : 1}
            value={Math.round(component.rect.width)}
            onChange={(width) =>
              onUpdate({
                rect: applyRectSizeWithAspect(
                  component.rect,
                  'width',
                  width,
                  lockAspect
                ),
              })
            }
          />
          <PropertyNumberInput
            label="Altura"
            suffix="px"
            min={component.type === 'qr' ? QR_MIN_SIZE : 1}
            value={Math.round(component.rect.height)}
            onChange={(height) =>
              onUpdate({
                rect: applyRectSizeWithAspect(
                  component.rect,
                  'height',
                  height,
                  lockAspect
                ),
              })
            }
          />
        </PropertyFieldGrid>
        {component.type === 'qr' && (
          <PropertyHint className="mt-2">O QR Code mantém a proporção quadrada.</PropertyHint>
        )}
        {component.type === 'image' && (
          <div className="mt-2 space-y-1">
            <PropertyCheckbox
              label="Travar proporção"
              checked={Boolean(component.imageProps?.lockAspectRatio)}
              onChange={(lockAspectRatio) =>
                onUpdate({
                  imageProps: { ...component.imageProps, lockAspectRatio },
                })
              }
            />
            <PropertyHint>Shift também trava ao redimensionar no canvas.</PropertyHint>
          </div>
        )}
      </PropertyAccordion>

      <PropertyAccordion
        title="Aparência"
        icon={Paintbrush}
        sectionId="component-appearance"
        reportId={reportId}
        defaultOpen={false}
        className="pt-2 border-t border-neutral-100"
      >
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
