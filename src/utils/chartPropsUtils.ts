import type { ChartProps } from '../types/report';
import type { LiveChartPreview } from '../store/designerStore';

export function mergeLiveChartProps(
  base: ChartProps | undefined,
  overlay: Partial<ChartProps> | null | undefined
): ChartProps | undefined {
  if (!base) return base;
  if (!overlay) return base;
  return { ...base, ...overlay };
}

export function chartPropsPatchEqual(
  a: Partial<ChartProps> | undefined,
  b: Partial<ChartProps> | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as (keyof ChartProps)[]);
  for (const key of keys) {
    const va = a[key];
    const vb = b[key];
    if (Array.isArray(va) && Array.isArray(vb)) {
      if (va.length !== vb.length || va.some((value, index) => value !== vb[index])) {
        return false;
      }
      continue;
    }
    if (va !== vb) return false;
  }
  return true;
}

export function liveChartPreviewEqual(
  prev: LiveChartPreview | null,
  next: LiveChartPreview
): boolean {
  if (!prev) return false;
  return (
    prev.componentId === next.componentId &&
    chartPropsPatchEqual(prev.chartProps, next.chartProps)
  );
}
