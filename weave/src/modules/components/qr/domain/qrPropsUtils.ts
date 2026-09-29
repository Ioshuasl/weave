import type { QrErrorCorrection, QrProps } from '../../common/domain';

export function getQrErrorCorrection(props?: QrProps): QrErrorCorrection {
  return props?.errorCorrection ?? 'M';
}

export function getQrForeground(props?: QrProps): string {
  return props?.foreground || '#000000';
}

export function getQrBackground(props?: QrProps): string {
  return props?.background || '#ffffff';
}

export function getQrMargin(props?: QrProps): number {
  const n = props?.margin;
  if (typeof n !== 'number' || Number.isNaN(n)) return 1;
  return Math.min(8, Math.max(0, Math.round(n)));
}
