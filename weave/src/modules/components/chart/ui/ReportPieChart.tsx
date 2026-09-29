import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';
import type { ChartProps } from '../../common/domain';
import { usesCustomChartLegend } from '../domain/chartRichText';
import { cn } from '../../../../shared/ui/cn';
import { getChartColorPalette } from '../domain/chartUtils';

interface ReportPieChartProps {
  data: Record<string, unknown>[];
  chartProps: ChartProps;
  width: number;
  height: number;
  className?: string;
}

export function ReportPieChart({
  data,
  chartProps,
  width,
  height,
  className,
}: ReportPieChartProps) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const nameKey = chartProps.nameKey ?? chartProps.xAxisKey ?? 'name';
  const valueKey = chartProps.valueKey ?? chartProps.yAxisKey ?? 'value';
  const palette = getChartColorPalette(chartProps);
  const innerRadius = Math.max(0, chartProps.innerRadius ?? 0);
  const outerRadius = Math.max(24, Math.min(w, h) / 2 - 12);
  const showAutoLegend =
    chartProps.showLegend !== false && !usesCustomChartLegend(chartProps);
  const showTooltip = chartProps.showTooltip !== false;
  const maxSlices = chartProps.maxSlices;
  const displayData =
    maxSlices && maxSlices > 0 ? data.slice(0, maxSlices) : data;

  return (
    <div className={cn(className)} style={{ width: w, height: h }}>
      <PieChart width={w} height={h}>
        {showTooltip && <Tooltip />}
        {showAutoLegend && <Legend />}
        <Pie
          data={displayData}
          dataKey={valueKey}
          nameKey={nameKey}
          cx={w / 2}
          cy={h / 2}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={1}
          stroke={chartProps.barStroke ?? '#ffffff'}
          strokeWidth={chartProps.barStrokeWidth ?? 1}
        >
          {displayData.map((entry, index) => (
            <Cell
              key={`slice-${String((entry as Record<string, unknown>)[nameKey] ?? index)}`}
              fill={palette[index % palette.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </div>
  );
}
