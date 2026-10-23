import { createId } from '../../../shared/domain/id';
import {
  type ComponentType,
  type ReportComponent,
  getDefaultComponentSize,
  squareQrRect,
} from '../../components/common/domain';
import { DEFAULT_IMAGE_PLACEHOLDER_SRC } from '../../components/image/domain';

/** Componente novo com os padrões de cada tipo (usado ao inserir na banda ou como elemento solto). */
export function buildNewComponent(
  bandId: string,
  type: ComponentType,
  initialProps?: Partial<ReportComponent>,
): ReportComponent {
  const size = getDefaultComponentSize(type);
  const defaultRect = { x: 10, y: 10, ...size };
  const mergedRect = initialProps?.rect ? { ...defaultRect, ...initialProps.rect } : defaultRect;
  const rect = type === 'qr' ? squareQrRect(mergedRect) : mergedRect;

  return {
    id: createId(),
    type,
    name: `${type}1`,
    parentId: bandId,
    rect,
    content:
      initialProps?.content ??
      (type === 'text' ? 'Texto' : type === 'image' ? DEFAULT_IMAGE_PLACEHOLDER_SRC : ''),
    style: {
      fontSize: '14px',
      color: '#000000',
      backgroundColor: type === 'shape' ? '#e5e5e5' : type === 'line' ? '#000000' : undefined,
      border: type === 'shape' ? '1px solid #000' : undefined,
      ...initialProps?.style,
    },
    imageProps:
      type === 'image'
        ? {
            sizeMode: 'contain',
            ...initialProps?.imageProps,
          }
        : undefined,
    qrProps:
      type === 'qr'
        ? {
            errorCorrection: 'M',
            foreground: '#000000',
            background: '#ffffff',
            margin: 1,
            ...initialProps?.qrProps,
          }
        : undefined,
    tableProps:
      type === 'table'
        ? {
            rows: [
              ['Coluna 1', 'Coluna 2'],
              ['Célula 1', 'Célula 2'],
            ],
            hasHeader: true,
          }
        : undefined,
    chartProps:
      type === 'chart'
        ? {
            chartKind: 'bar',
            dataset: 'users',
            xAxisKey: 'name',
            yAxisKey: 'id',
            barColor: '#8884d8',
            showGrid: true,
            showLegend: true,
            showTooltip: true,
          }
        : undefined,
  };
}
