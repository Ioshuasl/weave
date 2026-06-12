import type { ReportBand } from '../types/report';

/** z-index relativo dentro da banda (último na lista = mais acima) */
export function getComponentStackZIndex(
  band: ReportBand | undefined,
  componentId: string,
  isActive: boolean
): number {
  if (isActive) return 1000;
  if (!band) return 1;
  const index = band.components.indexOf(componentId);
  return index >= 0 ? index + 2 : 1;
}
