import { Upload } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  estimateDataUrlBytes,
  formatImageBytes,
  getImageAlignX,
  getImageAlignY,
  getImageOpacity,
  getImageRotation,
  getImageSizeMode,
  isImageSourceEditorMasked,
  isImageWatermark,
  isUserEmbeddedImageSrc,
  MAX_EMBEDDED_IMAGE_BYTES,
  resolveReportImageSrc,
  alignXToCrop,
  alignYToCrop,
  cropToAlignX,
  cropToAlignY,
  getImageCropX,
  getImageCropY,
} from '../../../../components/image/domain';
import { ReportImage } from '../../../../components/image/ui';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';
import { useDesignerServices } from '../../services/DesignerServicesContext';
import { cn } from '../../../../../shared/ui/cn';
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { type ComboboxGroup, PropertyCombobox } from '../controls/PropertyCombobox';
import {
  PropertyCheckbox,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
  PropertySlider,
  PropertyTextarea,
  PropertyTextInput,
} from '../controls/PropertyFields';
import type { ImageAlignX, ImageAlignY, ImageSizeMode, ReportComponent } from '../../../../components/common/domain';
import type { DataSourceCatalog } from '../../../../data-source/domain';
import type { DataFieldOption } from '../../../../expression/domain';

const SIZE_MODE_OPTIONS: { value: ImageSizeMode; label: string }[] = [
  { value: 'contain', label: 'Inteira' },
  { value: 'cover', label: 'Preencher' },
  { value: 'fill', label: 'Esticar' },
];

const SIZE_MODE_HINTS: Record<ImageSizeMode, string> = {
  contain: 'A imagem aparece inteira dentro do espaço.',
  cover: 'A imagem preenche o espaço; as bordas podem ser cortadas.',
  fill: 'A imagem é esticada para ocupar todo o espaço.',
};

const ALIGN_X: ImageAlignX[] = ['left', 'center', 'right'];
const ALIGN_Y: ImageAlignY[] = ['top', 'middle', 'bottom'];

const ROTATION_OPTIONS = ['0', '90', '180', '270'].map((deg) => ({ value: deg, label: `${deg}°` }));

const FIELD_TOKEN = /^\{[^{}\n]+\}$/;

export function ImagePropertiesSection({
  component,
  reportId,
  groupedDataFields,
  data,
  dataSourceCatalog,
  onUpdate,
}: {
  component: ReportComponent;
  reportId: string;
  groupedDataFields: {
    singletons: DataFieldOption[];
    lists: DataFieldOption[];
    all: DataFieldOption[];
  };
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  onUpdate: (updates: Partial<ReportComponent>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [compressHint, setCompressHint] = useState<string | null>(null);
  const parentDataSource = useDesignerStore(
    (state) => state.report.bands[component.parentId]?.dataSource
  );

  const sizeMode = getImageSizeMode(component.imageProps);
  const alignX = getImageAlignX(component.imageProps);
  const alignY = getImageAlignY(component.imageProps);
  const opacity = getImageOpacity(component.imageProps);
  const rotation = getImageRotation(component.imageProps);
  const cropX = getImageCropX(component.imageProps);
  const cropY = getImageCropY(component.imageProps);

  const previewSrc = useMemo(() => {
    const rows = parentDataSource ? data[parentDataSource] : undefined;
    const first = Array.isArray(rows) ? rows[0] : undefined;
    const row =
      first && typeof first === 'object' && first !== null
        ? (first as Record<string, unknown>)
        : undefined;
    return resolveReportImageSrc(component.content, { data, dataSourceCatalog, row });
  }, [component.content, data, dataSourceCatalog, parentDataSource]);

  const embeddedBytes = isUserEmbeddedImageSrc(component.content)
    ? estimateDataUrlBytes(component.content)
    : 0;
  const sourceEditorMasked = isImageSourceEditorMasked(component.content);

  const { imageEmbedder } = useDesignerServices();

  const patchImageProps = useCallback(
    (patch: Partial<NonNullable<ReportComponent['imageProps']>>) => {
      onUpdate({ imageProps: { ...component.imageProps, ...patch } });
    },
    [component.imageProps, onUpdate]
  );

  const fieldGroups: ComboboxGroup[] = [
    { label: 'Dados gerais', options: groupedDataFields.singletons },
    { label: 'Registros', options: groupedDataFields.lists },
  ]
    .map((group) => ({
      label: group.label,
      options: group.options.map((opt) => ({ label: opt.label, value: opt.value })),
    }))
    .filter((group) => group.options.length > 0);

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setCompressHint(null);
    try {
      const result = await imageEmbedder(file);
      onUpdate({ content: result.dataUrl });
      if (result.compressed) {
        setCompressHint(
          `Comprimida de ${formatImageBytes(result.originalBytes)} para ${formatImageBytes(result.finalBytes)}.`
        );
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Falha ao carregar a imagem.');
    }
  };

  const hasEmbedded = isUserEmbeddedImageSrc(component.content);
  const fieldToken = FIELD_TOKEN.test(component.content.trim()) ? component.content.trim() : '';

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <div
          data-image-thumbnail
          className="relative h-28 overflow-hidden rounded-lg bg-neutral-100"
        >
          <ReportImage
            src={previewSrc}
            sizeMode={sizeMode}
            cropX={cropX}
            cropY={cropY}
            opacity={opacity}
            rotation={rotation}
            alt=""
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          className="sr-only"
          data-image-upload
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            void onPickFile(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[13px] font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          <Upload className="size-3.5" />
          {hasEmbedded ? 'Trocar imagem' : 'Carregar imagem'}
        </button>
        {hasEmbedded && (
          <PropertyHint>
            Imagem guardada no relatório ({formatImageBytes(embeddedBytes)}; máximo {formatImageBytes(MAX_EMBEDDED_IMAGE_BYTES)}).
          </PropertyHint>
        )}
        {compressHint && <PropertyHint>{compressHint}</PropertyHint>}
        {uploadError && (
          <p className="text-[12px] leading-snug text-red-600" role="alert">
            {uploadError}
          </p>
        )}

        {fieldGroups.length > 0 && (
          <PropertyCombobox
            label="Ou usar uma imagem dos dados"
            value={fieldToken}
            onChange={(token) => {
              setUploadError(null);
              onUpdate({ content: token });
            }}
            groups={fieldGroups}
            placeholder="Escolher informação…"
            searchPlaceholder="Buscar…"
          />
        )}
      </div>

      <section className="space-y-3">
        <h4 className="text-[13px] font-semibold text-neutral-800">Encaixe</h4>
        <PropertySegmentedControl
          value={sizeMode}
          onChange={(next) => patchImageProps({ sizeMode: next })}
          options={SIZE_MODE_OPTIONS}
        />
        <PropertyHint>{SIZE_MODE_HINTS[sizeMode]}</PropertyHint>

        {sizeMode !== 'fill' && (
          <div>
            <span className="mb-1 block text-[12px] font-medium text-neutral-600">Posição da imagem</span>
            <div className="grid w-24 grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1">
              {ALIGN_Y.flatMap((y) =>
                ALIGN_X.map((x) => {
                  const active = alignX === x && alignY === y;
                  return (
                    <button
                      key={`${x}-${y}`}
                      type="button"
                      aria-label={`Posição ${y} ${x}`}
                      aria-pressed={active}
                      onClick={() =>
                        patchImageProps({
                          alignX: x,
                          alignY: y,
                          cropX: alignXToCrop(x),
                          cropY: alignYToCrop(y),
                        })
                      }
                      className={cn(
                        'h-6 rounded transition-colors',
                        active ? 'bg-indigo-600' : 'bg-weave-surface hover:bg-indigo-100'
                      )}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-[13px] font-semibold text-neutral-800">Aparência</h4>
        <PropertySlider
          label="Opacidade"
          value={Math.round(opacity * 100)}
          onChange={(percent) => patchImageProps({ opacity: percent / 100 })}
        />
        <PropertyCheckbox
          label="Usar como marca d'água"
          checked={isImageWatermark(component.imageProps)}
          onChange={(on) => patchImageProps({ opacity: on ? 0.2 : 1 })}
        />
        <PropertySegmentedControl
          label="Girar"
          value={String(Math.round(rotation))}
          onChange={(deg) => patchImageProps({ rotation: Number(deg) })}
          options={ROTATION_OPTIONS}
        />
      </section>

      <PropertyAccordion title="Avançado" sectionId="image-advanced" reportId={reportId} defaultOpen={false}>
        <PropertyTextarea
          label="Endereço da imagem (URL)"
          rows={2}
          value={sourceEditorMasked ? '' : component.content}
          onChange={(content) => {
            setUploadError(null);
            onUpdate({ content });
          }}
          placeholder={
            sourceEditorMasked
              ? 'Imagem carregada — cole um endereço para substituir'
              : 'https://exemplo.com/imagem.png'
          }
        />
        <PropertyTextInput
          label="Descrição da imagem"
          value={component.imageProps?.alt ?? ''}
          onChange={(alt) => patchImageProps({ alt })}
          placeholder="Texto que descreve a imagem"
        />
        <PropertyTextInput
          label="Link ao clicar"
          value={component.imageProps?.href ?? ''}
          onChange={(href) => patchImageProps({ href })}
          placeholder="https://exemplo.com"
          hint="Vale na visualização e na impressão."
        />
        <PropertyFieldGrid>
          <PropertyNumberInput
            label="Rotação livre"
            suffix="°"
            min={-360}
            max={360}
            value={Math.round(rotation)}
            onChange={(next) => patchImageProps({ rotation: next })}
          />
          {sizeMode !== 'fill' && (
            <>
              <PropertyNumberInput
                label="Foco horizontal"
                suffix="%"
                min={0}
                max={100}
                value={Math.round(cropX)}
                onChange={(next) => patchImageProps({ cropX: next, alignX: cropToAlignX(next) })}
              />
              <PropertyNumberInput
                label="Foco vertical"
                suffix="%"
                min={0}
                max={100}
                value={Math.round(cropY)}
                onChange={(next) => patchImageProps({ cropY: next, alignY: cropToAlignY(next) })}
              />
            </>
          )}
        </PropertyFieldGrid>
      </PropertyAccordion>
    </div>
  );
}
