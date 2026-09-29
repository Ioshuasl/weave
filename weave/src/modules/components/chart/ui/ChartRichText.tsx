import React, { useMemo } from 'react';
import type { EvaluateExpressionContext } from '../../../expression/domain';
import { renderChartRichTextHtml } from '../domain/chartRichText';
import { cn } from '../../../../shared/ui/cn';

export function ChartRichText({
  content,
  context,
  className,
}: {
  content?: string;
  context: EvaluateExpressionContext;
  className?: string;
}) {
  const html = useMemo(
    () => renderChartRichTextHtml(content, context),
    [content, context]
  );

  if (!html) return null;

  return (
    <div
      className={cn(
        'rich-text text-[11px] leading-snug text-neutral-700 min-w-0',
        '[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic',
        '[&_u]:underline [&_s]:line-through [&_strike]:line-through [&_del]:line-through',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
