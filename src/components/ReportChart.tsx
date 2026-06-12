import React, { useMemo } from 'react';
import type { DataSourceCatalog } from '../utils/dataSourceUtils';
import type { ChartProps } from '../types/report';
import { chartPropsPatchEqual } from '../utils/chartPropsUtils';
import { buildChartExpressionContext } from '../utils/chartRichText';
import { getChartKind } from '../utils/chartUtils';
import { ChartFrame } from './charts/ChartFrame';
import { ReportBarChart } from './ReportBarChart';
import { ReportPieChart } from './ReportPieChart';

interface ReportChartProps {
  data: Record<string, unknown>[];
  chartProps: ChartProps;
  width: number;
  height: number;
  className?: string;
  reportData?: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
}

export const ReportChart = React.memo(function ReportChart({
  data,
  chartProps,
  width,
  height,
  className,
  reportData,
  dataSourceCatalog,
}: ReportChartProps) {
  const expressionContext = useMemo(
    () =>
      buildChartExpressionContext(
        reportData ?? {},
        dataSourceCatalog,
        data[0] as Record<string, unknown> | undefined
      ),
    [reportData, dataSourceCatalog, data]
  );

  return (
    <ChartFrame
      chartProps={chartProps}
      width={width}
      height={height}
      className={className}
      expressionContext={expressionContext}
    >
      {(chartWidth, chartHeight) =>
        getChartKind(chartProps) === 'pie' ? (
          <ReportPieChart
            data={data}
            chartProps={chartProps}
            width={chartWidth}
            height={chartHeight}
            className="absolute inset-0"
          />
        ) : (
          <ReportBarChart
            data={data}
            chartProps={chartProps}
            width={chartWidth}
            height={chartHeight}
            className="absolute inset-0"
            expressionContext={expressionContext}
          />
        )
      }
    </ChartFrame>
  );
}, (prev, next) =>
  prev.width === next.width &&
  prev.height === next.height &&
  prev.className === next.className &&
  prev.data === next.data &&
  prev.reportData === next.reportData &&
  prev.dataSourceCatalog === next.dataSourceCatalog &&
  chartPropsPatchEqual(prev.chartProps, next.chartProps)
);
