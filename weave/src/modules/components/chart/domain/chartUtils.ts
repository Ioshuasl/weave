import type { ChartProps } from '../../common/domain';

export const DEFAULT_CHART_COLOR_PALETTE = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
] as const;

export function getChartKind(chartProps: ChartProps): 'bar' | 'pie' {
  return chartProps.chartKind ?? 'bar';
}

export function getChartColorPalette(chartProps: ChartProps): string[] {
  if (chartProps.colorPalette && chartProps.colorPalette.length > 0) {
    return chartProps.colorPalette;
  }
  if (chartProps.barColor) {
    return [chartProps.barColor, ...DEFAULT_CHART_COLOR_PALETTE.filter((c) => c !== chartProps.barColor)];
  }
  return [...DEFAULT_CHART_COLOR_PALETTE];
}

export function createDefaultBarChartProps(dataset = 'users'): ChartProps {
  return {
    chartKind: 'bar',
    dataset,
    xAxisKey: 'name',
    yAxisKey: 'sales',
    barColor: '#4f46e5',
    showGrid: true,
    showLegend: true,
    showTooltip: true,
  };
}

export function createDefaultPieChartProps(dataset = 'users'): ChartProps {
  return {
    chartKind: 'pie',
    dataset,
    nameKey: 'name',
    valueKey: 'sales',
    innerRadius: 0,
    showLegend: true,
    showTooltip: true,
    colorPalette: [...DEFAULT_CHART_COLOR_PALETTE],
  };
}
