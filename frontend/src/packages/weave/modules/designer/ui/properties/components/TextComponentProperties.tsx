import { Move, Paintbrush } from 'lucide-react';
import React from 'react';
import { type ReportComponent, QR_MIN_SIZE } from '../../../../components/common/domain';
import { applyRectSizeWithAspect } from '../../../../components/image/domain';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { PropertyActionBar } from '../controls/PropertyActionBar';
import { PropertyBorderRadiusInput } from '../controls/PropertyBorderInput';
import { PropertyBorderSidesInput } from '../controls/PropertyBorderSidesInput';
import { type ComboboxGroup, PropertyCombobox } from '../controls/PropertyCombobox';
import {
  PropertyCheckbox,
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertyTextInput,
} from '../controls/PropertyFields';
import { ChartPropertiesSection } from './ChartPropertiesSection';
import { ElementPlacementSection } from './ElementPlacementSection';
import { ImagePropertiesSection } from './ImagePropertiesSection';
import { QrPropertiesSection } from './QrPropertiesSection';
import { TablePropertiesSection } from './TablePropertiesSection';
import { TextComponentContentSummary } from './TextComponentContentSummary';
import { TextStyleSection } from './TextStyleSection';
import type { DataSourceCatalog } from '../../../../data-source/domain';
import type { DataFieldOption } from '../../../../expression/domain';

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
  const hasContent = component.type !== 'shape';
  const parentBand = useDesignerStore((state) => state.report.bands[component.parentId]);
  // Elemento solto: X/Y mostrados e editados na folha (a banda invisível acompanha)
  const offset = parentBand?.element && parentBand.bandRect ? parentBand.bandRect : { x: 0, y: 0 };

  // Texto que é só um campo (ou ainda vazio): troca o campo por menu, sem digitar `{dataset.campo}`.
  const trimmedContent = component.content.trim();
  const singleFieldToken = /^\{[^{}\n]+\}$/.test(trimmedContent) ? trimmedContent : '';
  const canPickField =
    component.type === 'text' && (singleFieldToken !== '' || trimmedContent === '' || trimmedContent === 'Texto');
  const fieldGroups: ComboboxGroup[] = [
    { label: 'Dados gerais', options: groupedDataFields.singletons },
    { label: 'Registros', options: groupedDataFields.lists },
  ]
    .map((group) => ({
      label: group.label,
      options: group.options.map((opt) => ({ label: opt.label, value: opt.value, description: opt.value })),
    }))
    .filter((group) => group.options.length > 0);

  const contentTab = (
    <>
      {canPickField && fieldGroups.length > 0 && (
        <PropertyCombobox
          label="Informação mostrada"
          value={singleFieldToken}
          onChange={(token) => onUpdate({ content: token })}
          groups={fieldGroups}
          placeholder="Escolha um campo…"
          searchPlaceholder="Buscar campo…"
          hint="Para misturar texto e informações, use Editar texto."
        />
      )}

      {component.type === 'text' && (
        <TextComponentContentSummary component={component} componentId={componentId} />
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
          reportId={reportId}
          fieldOptions={groupedDataFields.lists}
          onUpdate={onUpdate}
        />
      )}

      {component.type === 'chart' && component.chartProps && (
        <ChartPropertiesSection
          componentId={componentId}
          reportId={reportId}
          chartProps={component.chartProps}
          data={data}
          dataSourceCatalog={dataSourceCatalog}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
  const dimensionsTab = (
    <>
      <PropertyFieldGrid>
        <PropertyNumberInput
          label="X"
          suffix="px"
          value={Math.round(component.rect.x + offset.x)}
          onChange={(x) => onUpdate({ rect: { ...component.rect, x: x - offset.x } })}
        />
        <PropertyNumberInput
          label="Y"
          suffix="px"
          value={Math.round(component.rect.y + offset.y)}
          onChange={(y) => onUpdate({ rect: { ...component.rect, y: y - offset.y } })}
        />
        <PropertyNumberInput
          label="Largura"
          suffix="px"
          min={component.type === 'qr' ? QR_MIN_SIZE : 1}
          value={Math.round(component.rect.width)}
          onChange={(width) =>
            onUpdate({
              rect: applyRectSizeWithAspect(component.rect, 'width', width, lockAspect),
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
              rect: applyRectSizeWithAspect(component.rect, 'height', height, lockAspect),
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
    </>
  );
  const styleBlock = (
    <>
      {component.type === 'text' && (
        <TextStyleSection component={component} componentId={componentId} onPatchStyle={onPatchStyle} onUpdate={onUpdate} />
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

      <PropertyBorderSidesInput label="Bordas" style={component.style} onChange={(style) => onUpdate({ style })} />

      <PropertyBorderRadiusInput
        label="Cantos arredondados"
        value={String(component.style.borderRadius || '')}
        onChange={(borderRadius) =>
          onUpdate({
            style: { ...component.style, borderRadius: borderRadius || undefined },
          })
        }
      />
    </>
  );

  const appearanceOpenByDefault = component.type === 'text' || component.type === 'shape';

  return (
    <>
      {parentBand?.element && <ElementPlacementSection band={parentBand} />}

      {hasContent && <div className="min-w-0 space-y-4">{contentTab}</div>}

      <PropertyAccordion
        title="Aparência"
        icon={Paintbrush}
        sectionId={`appearance-${component.type}`}
        reportId={reportId}
        defaultOpen={appearanceOpenByDefault}
        className="border-t border-neutral-100 pt-3"
      >
        {styleBlock}
      </PropertyAccordion>

      <PropertyAccordion
        title="Posição e espaçamento"
        icon={Move}
        sectionId="advanced-rect"
        reportId={reportId}
        defaultOpen={false}
        className="border-t border-neutral-100 pt-3"
      >
        {dimensionsTab}
        <PropertyTextInput
          label="Espaçamento interno"
          value={String(component.style.padding || '')}
          onChange={(padding) => onUpdate({ style: { ...component.style, padding } })}
          placeholder="4px 8px"
          hint="Distância entre a borda e o conteúdo (ex.: 4px 8px)."
        />
      </PropertyAccordion>

      <PropertyActionBar
        onCopy={onCopy}
        onDuplicate={onDuplicate}
        canPaste={canPaste}
        onPaste={onPaste}
        onRemove={onRemove}
      />
    </>
  );
}
