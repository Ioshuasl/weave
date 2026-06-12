import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartProps } from '../types/report';
import { usesCustomChartLegend } from '../utils/chartRichText';
import { evaluateExpression, type EvaluateExpressionContext } from '../utils/reportUtils';
import { cn } from '../utils/cn';
import { DEFAULT_CHART_COLOR_PALETTE } from '../utils/chartUtils';

interface ReportBarChartProps {
  data: Record<string, unknown>[];
  chartProps: ChartProps;
  width: number;
  height: number;
  className?: string;
  expressionContext?: EvaluateExpressionContext;
}

/** Gráfico com dimensões explícitas — evita width/height -1 do ResponsiveContainer em flex/absolute. */
export function ReportBarChart({
  data,
  chartProps,
  width,
  height,
  className,
  expressionContext,
}: ReportBarChartProps) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const xAxisKey = chartProps.xAxisKey ?? 'name';
  const yAxisKey = chartProps.yAxisKey ?? 'value';
  const barColor = chartProps.barColor ?? DEFAULT_CHART_COLOR_PALETTE[0];
  const showAutoLegend =
    chartProps.showLegend !== false && !usesCustomChartLegend(chartProps);
  const seriesName = chartProps.seriesLabel?.trim()
    ? evaluateExpression(chartProps.seriesLabel, expressionContext)
    : yAxisKey;
  const xAxisLabel = chartProps.xAxisLabel?.trim()
    ? evaluateExpression(chartProps.xAxisLabel, expressionContext)
    : undefined;
  const yAxisLabel = chartProps.yAxisLabel?.trim()
    ? evaluateExpression(chartProps.yAxisLabel, expressionContext)
    : undefined;

  return (
    <div className={cn(className)} style={{ width: w, height: h }}>
      <BarChart width={w} height={h} data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        {chartProps.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisKey}>
          {xAxisLabel && <Label value={xAxisLabel} position="insideBottom" offset={-5} />}
        </XAxis>
        <YAxis>
          {yAxisLabel && (
            <Label
              value={yAxisLabel}
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle' }}
            />
          )}
        </YAxis>
        {chartProps.showTooltip !== false && <Tooltip />}
        {showAutoLegend && <Legend />}
        <Bar
          dataKey={yAxisKey}
          name={seriesName}
          fill={barColor}
          stroke={chartProps.barStroke}
          strokeWidth={chartProps.barStrokeWidth ?? 0}
        />
      </BarChart>
    </div>
  );
}
