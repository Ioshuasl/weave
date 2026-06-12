import React, { useEffect, useRef, useState } from 'react';
import type { ChartProps } from '../../types/report';
import type { EvaluateExpressionContext } from '../../utils/reportUtils';
import { usesCustomChartLegend } from '../../utils/chartRichText';
import { cn } from '../../utils/cn';
import { ChartRichText } from './ChartRichText';

export function ChartFrame({
  chartProps,
  width,
  height,
  className,
  expressionContext,
  children,
}: {
  chartProps: ChartProps;
  width: number;
  height: number;
  className?: string;
  expressionContext: EvaluateExpressionContext;
  children: (chartWidth: number, chartHeight: number) => React.ReactNode;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({
    w: Math.max(1, Math.round(width)),
    h: Math.max(1, Math.round(height)),
  });

  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const showCustomLegend =
    chartProps.showLegend !== false && usesCustomChartLegend(chartProps);
  const legendOnTop = (chartProps.legendPosition ?? 'bottom') === 'top';
  const titleBlock = chartProps.titleContent?.trim() ? (
    <ChartRichText
      content={chartProps.titleContent}
      context={expressionContext}
      className="px-2 pt-1.5 font-medium text-neutral-800"
    />
  ) : null;
  const legendBlock = showCustomLegend ? (
    <ChartRichText
      content={chartProps.legendContent}
      context={expressionContext}
      className="px-2 py-1 text-neutral-600 max-h-[28%] overflow-y-auto"
    />
  ) : null;

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;

    const update = () => {
      setChartSize({
        w: Math.max(1, el.clientWidth),
        h: Math.max(1, el.clientHeight),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [w, h, chartProps.titleContent, chartProps.legendContent, chartProps.legendMode]);

  return (
    <div
      className={cn('flex flex-col overflow-hidden min-w-0', className)}
      style={{
        width: w,
        height: h,
        backgroundColor: chartProps.backgroundColor ?? 'transparent',
        border: chartProps.border,
        borderRadius: chartProps.borderRadius,
      }}
    >
      {titleBlock}
      {legendOnTop && legendBlock}
      <div ref={areaRef} className="relative flex-1 min-h-0 min-w-0">
        {children(chartSize.w, chartSize.h)}
      </div>
      {!legendOnTop && legendBlock}
    </div>
  );
}
