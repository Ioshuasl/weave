import type {
  ImageAlignX,
  ImageAlignY,
  ImageProps,
  ImageSizeMode,
  Rect,
} from '../types/report';
import { evaluateExpression, type EvaluateExpressionContext } from './reportUtils';

/** SVG interno — evita CDN (via.placeholder.com) em componentes novos */
export const DEFAULT_IMAGE_PLACEHOLDER_SRC =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="#f4f4f5"/><rect x="18" y="18" width="124" height="124" rx="10" fill="none" stroke="#d4d4d8" stroke-width="2" stroke-dasharray="6 4"/><circle cx="62" cy="64" r="10" fill="#a1a1aa"/><path fill="#a1a1aa" d="M40 118l28-34 18 22 14-12 28 24v12H40z"/></svg>'
  );

/** Limite para embutir no JSON do relatório (arquivo original, não o data URL) */
export const MAX_EMBEDDED_IMAGE_BYTES = 400 * 1024;

const LEGACY_NETWORK_PLACEHOLDERS = new Set([
  'https://via.placeholder.com/150',
  'http://via.placeholder.com/150',
]);

export function getImageSizeMode(props?: ImageProps): ImageSizeMode {
  return props?.sizeMode ?? 'contain';
}

export function getImageAlignX(props?: ImageProps): ImageAlignX {
  return props?.alignX ?? 'center';
}

export function getImageAlignY(props?: ImageProps): ImageAlignY {
  return props?.alignY ?? 'middle';
}

export function getImageOpacity(props?: ImageProps): number {
  const n = props?.opacity;
  if (typeof n !== 'number' || Number.isNaN(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

export function getImageRotation(props?: ImageProps): number {
  const n = props?.rotation;
  if (typeof n !== 'number' || Number.isNaN(n)) return 0;
  return n;
}

export function isImageWatermark(props?: ImageProps): boolean {
  const opacity = getImageOpacity(props);
  return opacity > 0 && opacity <= 0.25;
}

export function sanitizeImageHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return '';
  }
  return trimmed;
}

export function resolveReportImageHref(
  href: string | undefined,
  context?: EvaluateExpressionContext
): string {
  const raw = (href ?? '').trim();
  if (!raw) return '';
  return sanitizeImageHref(evaluateExpression(raw, context).trim());
}

export function objectFitFromImageSizeMode(
  mode: ImageSizeMode
): 'contain' | 'cover' | 'fill' {
  if (mode === 'cover') return 'cover';
  if (mode === 'fill') return 'fill';
  return 'contain';
}

export function isLegacyNetworkPlaceholder(src: string): boolean {
  return LEGACY_NETWORK_PLACEHOLDERS.has(src.trim());
}

export function isEmbeddedImageSrc(src: string): boolean {
  return src.trim().toLowerCase().startsWith('data:image/');
}

/** Data URL gerado por upload (FileReader) — não inclui o SVG placeholder interno */
export function isUserEmbeddedImageSrc(src: string): boolean {
  return /data:image\/[^;]+;base64,/i.test(src.trim());
}

export function isImageSourceEditorMasked(content: string): boolean {
  return content === DEFAULT_IMAGE_PLACEHOLDER_SRC || isUserEmbeddedImageSrc(content);
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor(payload.length * 0.75);
}

export function formatImageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb >= 100 ? `${Math.round(kb)} KB` : `${kb.toFixed(1)} KB`;
}

export function resolveReportImageSrc(
  content: string | undefined,
  context?: EvaluateExpressionContext
): string {
  const raw = (content ?? '').trim();
  if (!raw) return '';

  const evaluated = evaluateExpression(raw, context).trim();
  if (!evaluated) return '';
  if (isLegacyNetworkPlaceholder(evaluated)) {
    return DEFAULT_IMAGE_PLACEHOLDER_SRC;
  }
  return evaluated;
}

export function resolveReportImageAlt(
  alt: string | undefined,
  context?: EvaluateExpressionContext
): string {
  const raw = (alt ?? '').trim();
  if (!raw) return '';
  return evaluateExpression(raw, context).trim();
}

export function applyRectSizeWithAspect(
  rect: Rect,
  dim: 'width' | 'height',
  value: number,
  lockAspect: boolean
): Rect {
  const nextValue = Math.max(1, value);
  if (!lockAspect) {
    return { ...rect, [dim]: nextValue };
  }
  const ratio = rect.width / Math.max(1, rect.height);
  if (dim === 'width') {
    return {
      ...rect,
      width: nextValue,
      height: Math.max(1, Math.round(nextValue / ratio)),
    };
  }
  return {
    ...rect,
    height: nextValue,
    width: Math.max(1, Math.round(nextValue * ratio)),
  };
}

export function resizeRectWithAspectLock(
  start: Pick<Rect, 'width' | 'height'>,
  deltaX: number,
  deltaY: number,
  lockAspect: boolean,
  minSize = 20
): Pick<Rect, 'width' | 'height'> {
  let width = Math.max(minSize, start.width + deltaX);
  let height = Math.max(minSize, start.height + deltaY);
  if (!lockAspect) return { width, height };

  const ratio = start.width / Math.max(1, start.height);
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    width = Math.max(minSize, start.width + deltaX);
    height = Math.max(minSize, width / ratio);
  } else {
    height = Math.max(minSize, start.height + deltaY);
    width = Math.max(minSize, height * ratio);
  }
  return { width, height };
}

export async function readImageFileAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem (PNG, JPEG, GIF, WebP ou SVG).');
  }
  if (file.size > MAX_EMBEDDED_IMAGE_BYTES) {
    throw new Error(
      `A imagem tem ${formatImageBytes(file.size)}. O máximo para embutir no JSON é ${formatImageBytes(MAX_EMBEDDED_IMAGE_BYTES)}. Use uma URL.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:image/')) {
        reject(new Error('Não foi possível ler o arquivo como imagem.'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}
