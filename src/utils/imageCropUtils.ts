import type { ImageAlignX, ImageAlignY, ImageProps } from '../types/report';

export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

export function alignXToCrop(align: ImageAlignX): number {
  if (align === 'left') return 0;
  if (align === 'right') return 100;
  return 50;
}

export function alignYToCrop(align: ImageAlignY): number {
  if (align === 'top') return 0;
  if (align === 'bottom') return 100;
  return 50;
}

export function cropToAlignX(cropX: number): ImageAlignX {
  if (cropX <= 25) return 'left';
  if (cropX >= 75) return 'right';
  return 'center';
}

export function cropToAlignY(cropY: number): ImageAlignY {
  if (cropY <= 25) return 'top';
  if (cropY >= 75) return 'bottom';
  return 'middle';
}

export function getImageCropX(props?: ImageProps): number {
  if (typeof props?.cropX === 'number' && !Number.isNaN(props.cropX)) {
    return clampPercent(props.cropX);
  }
  return alignXToCrop(props?.alignX ?? 'center');
}

export function getImageCropY(props?: ImageProps): number {
  if (typeof props?.cropY === 'number' && !Number.isNaN(props.cropY)) {
    return clampPercent(props.cropY);
  }
  return alignYToCrop(props?.alignY ?? 'middle');
}

export function objectPositionFromCrop(cropX: number, cropY: number): string {
  return `${clampPercent(cropX)}% ${clampPercent(cropY)}%`;
}
