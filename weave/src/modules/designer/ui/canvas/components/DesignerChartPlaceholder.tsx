import React from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import type { ChartProps } from '../../../../components/common/domain';
import { getChartKind } from '../../../../components/chart/domain';
import { FormattedText } from '../../../../components/text/ui';
import { cn } from '../../../../../shared/ui/cn';

interface DesignerChartPlaceholderProps {
  chartProps: ChartProps;
  className?: string;
}

/** Molde do gráfico no canvas — sem Recharts nem dados resolvidos. */
export function DesignerChartPlaceholder({
  chartProps,
  className,
}: DesignerChartPlaceholderProps) {
  const kind = getChartKind(chartProps);
  const isPie = kind === 'pie';
  const Icon = isPie ? PieChart : BarChart3;
  const title = chartProps.titleContent?.trim();
  const dataset = chartProps.dataset?.trim();

  return (
    <div
      data-designer-chart-placeholder
      className={cn(
        'absolute inset-0 flex flex-col pointer-events-none select-none',
        className
      )}
      style={{
        backgroundColor: chartProps.backgroundColor || '#fafafa',
        border: chartProps.border || '1px solid #e5e5e5',
        borderRadius: chartProps.borderRadius || '8px',
      }}
    >
      {title ? (
        <div className="px-2 pt-1.5 shrink-0">
          <FormattedText
            content={title}
            className="text-[11px] font-medium text-neutral-700 line-clamp-2"
          />
        </div>
      ) : null}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1 px-2 text-neutral-400">
        <Icon className="w-7 h-7 opacity-70" strokeWidth={1.5} />
        <p className="text-[11px] font-medium text-neutral-500">
          {isPie ? 'Gráfico de pizza' : 'Gráfico de barras'}
        </p>
        {dataset ? (
          <p className="text-[10px] font-mono text-neutral-400 truncate max-w-full">
            {dataset}
          </p>
        ) : (
          <p className="text-[10px] text-neutral-400">Sem fonte de dados</p>
        )}
      </div>
    </div>
  );
}
