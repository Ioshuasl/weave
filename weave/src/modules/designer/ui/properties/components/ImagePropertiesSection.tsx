import { useCallback, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { ImageAlignX, ImageAlignY, ImageSizeMode, ReportComponent } from '../../../../components/common/domain';
import type { DataFieldOption } from '../../../../expression/domain';
import type { DataSourceCatalog } from '../../../../data-source/domain';
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
import { embedImageFile } from '../../../../components/image/infrastructure';
import { pushRecentFieldToken } from '../../../infrastructure/fieldRecentStorage';
import { useDesignerStore } from '../../../application/store/designerStore';
import {
  PropertyCheckbox,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
  PropertyTextarea,
  PropertyTextInput,
} from '../controls/PropertyFields';
import { FieldChipBar } from '../../field-picker/FieldChipBar';
import { FieldTokenPicker } from '../../field-picker/FieldTokenPicker';
import { ReportImage } from '../../../../components/image/ui';

const SIZE_MODE_OPTIONS: { value: ImageSizeMode; label: string }[] = [
  { value: 'contain', label: 'Conter' },
  { value: 'cover', label: 'Cobrir' },
  { value: 'fill', label: 'Esticar' },
];

const ALIGN_X_OPTIONS: { value: ImageAlignX; label: string }[] = [
  { value: 'left', label: 'Esq.' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Dir.' },
];

const ALIGN_Y_OPTIONS: { value: ImageAlignY; label: string }[] = [
  { value: 'top', label: 'Topo' },
  { value: 'middle', label: 'Meio' },
  { value: 'bottom', label: 'Base' },
];

const ROTATION_PRESETS = [0, 90, 180, 270] as const;

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
  const [recentVersion, setRecentVersion] = useState(0);
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

  const patchImageProps = useCallback(
    (patch: Partial<NonNullable<ReportComponent['imageProps']>>) => {
      onUpdate({ imageProps: { ...component.imageProps, ...patch } });
    },
    [component.imageProps, onUpdate]
  );

  const insertField = useCallback(
    (token: string) => {
      setUploadError(null);
      onUpdate({ content: token });
      pushRecentFieldToken(token, reportId);
      setRecentVersion((n) => n + 1);
    },
    [onUpdate, reportId]
  );

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setCompressHint(null);
    try {
      const result = await embedImageFile(file);
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

  return (
    <div className="space-y-3">
      <div
        data-image-thumbnail
        className="relative h-20 rounded-md border border-neutral-200 overflow-hidden bg-neutral-50"
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
        {sizeMode !== 'fill' && (
          <button
            type="button"
            aria-label="Definir ponto de recorte"
            className="absolute inset-0 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const nextX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
              const nextY = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
              patchImageProps({
                cropX: Math.round(nextX),
                cropY: Math.round(nextY),
                alignX: cropToAlignX(nextX),
                alignY: cropToAlignY(nextY),
              });
            }}
          >
            <span
              className="absolute w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-500 shadow pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cropX}%`, top: `${cropY}%` }}
            />
          </button>
        )}
      </div>

      <PropertyTextarea
        label="URL ou campo da imagem"
        value={sourceEditorMasked ? '' : component.content}
        onChange={(content) => {
          setUploadError(null);
          onUpdate({ content });
        }}
        placeholder={
          sourceEditorMasked
            ? 'Arquivo embutido — cole uma URL ou campo para substituir'
            : 'https://exemplo.com/imagem.png ou {dataset.campo}'
        }
      />
      <PropertyHint>
        Cole uma URL, um data URL, carregue um arquivo, ou insira um campo com o endereço da
        imagem.
      </PropertyHint>

      {isUserEmbeddedImageSrc(component.content) && (
        <PropertyHint>
          Imagem embutida no JSON (~{formatImageBytes(embeddedBytes)}). Máximo{' '}
          {formatImageBytes(MAX_EMBEDDED_IMAGE_BYTES)}. Prefira uma URL se o host persistir o
          template.
        </PropertyHint>
      )}

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
        className="w-full flex items-center justify-center gap-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-md text-[13px] transition-colors border border-neutral-200"
      >
        <Upload className="w-3.5 h-3.5" />
        Carregar arquivo
      </button>
      {compressHint && <PropertyHint>{compressHint}</PropertyHint>}
      {uploadError && (
        <p className="text-[11px] text-red-600 leading-snug" role="alert">
          {uploadError}
        </p>
      )}

      <FieldChipBar
        singletons={groupedDataFields.singletons}
        reportId={reportId}
        recentVersion={recentVersion}
        onInsert={insertField}
      />

      <FieldTokenPicker
        singletons={groupedDataFields.singletons}
        lists={groupedDataFields.lists}
        reportId={reportId}
        insertHint="Clique em um campo para usar a URL armazenada nele."
        onInsert={insertField}
      />

      <PropertyTextInput
        label="Texto alternativo"
        value={component.imageProps?.alt ?? ''}
        onChange={(alt) => patchImageProps({ alt })}
        placeholder="Descrição da imagem ou {dataset.campo}"
      />

      <PropertySegmentedControl
        label="Ajuste no retângulo"
        value={sizeMode}
        onChange={(next) => patchImageProps({ sizeMode: next })}
        options={SIZE_MODE_OPTIONS}
      />

      {sizeMode !== 'fill' && (
        <>
          <PropertySegmentedControl
            label="Alinhamento horizontal"
            value={alignX}
            onChange={(next) =>
              patchImageProps({ alignX: next, cropX: alignXToCrop(next) })
            }
            options={ALIGN_X_OPTIONS}
          />
          <PropertySegmentedControl
            label="Alinhamento vertical"
            value={alignY}
            onChange={(next) =>
              patchImageProps({ alignY: next, cropY: alignYToCrop(next) })
            }
            options={ALIGN_Y_OPTIONS}
          />
          <PropertyFieldGrid>
            <PropertyNumberInput
              label="Recorte X"
              suffix="%"
              min={0}
              max={100}
              value={Math.round(cropX)}
              onChange={(next) =>
                patchImageProps({ cropX: next, alignX: cropToAlignX(next) })
              }
            />
            <PropertyNumberInput
              label="Recorte Y"
              suffix="%"
              min={0}
              max={100}
              value={Math.round(cropY)}
              onChange={(next) =>
                patchImageProps({ cropY: next, alignY: cropToAlignY(next) })
              }
            />
          </PropertyFieldGrid>
          <PropertyHint>
            No modo Cobrir, o ponto (X, Y) fica visível. Clique na miniatura para escolher o
            foco.
          </PropertyHint>
        </>
      )}

      <PropertyFieldGrid>
        <PropertyNumberInput
          label="Opacidade"
          suffix="%"
          min={0}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(percent) => patchImageProps({ opacity: percent / 100 })}
        />
        <PropertyNumberInput
          label="Rotação"
          suffix="°"
          min={-360}
          max={360}
          value={Math.round(rotation)}
          onChange={(next) => patchImageProps({ rotation: next })}
        />
      </PropertyFieldGrid>
      <PropertyCheckbox
        label="Marca d'água"
        checked={isImageWatermark(component.imageProps)}
        onChange={(on) => patchImageProps({ opacity: on ? 0.2 : 1 })}
      />
      <PropertyHint>15–25% de opacidade funciona bem como marca d&apos;água no relatório.</PropertyHint>

      <div>
        <span className="block text-[11px] font-medium text-neutral-600 mb-1">Giro rápido</span>
        <div className="flex gap-0.5 p-0.5 bg-neutral-100 border border-neutral-200/80 rounded-md">
          {ROTATION_PRESETS.map((deg) => {
            const active = Math.round(rotation) === deg;
            return (
              <button
                key={deg}
                type="button"
                onClick={() => patchImageProps({ rotation: deg })}
                className={
                  active
                    ? 'flex-1 py-1.5 px-1 text-[11px] rounded bg-white shadow-sm font-medium text-neutral-900'
                    : 'flex-1 py-1.5 px-1 text-[11px] rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }
              >
                {deg}°
              </button>
            );
          })}
        </div>
      </div>

      <PropertyTextInput
        label="Link ao clicar"
        value={component.imageProps?.href ?? ''}
        onChange={(href) => patchImageProps({ href })}
        placeholder="https://exemplo.com ou {dataset.url}"
      />
      <PropertyHint>
        Aberto no preview e na impressão. No canvas do designer o clique seleciona o componente.
      </PropertyHint>
    </div>
  );
}
