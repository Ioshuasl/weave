import type { DataSourceCatalog } from './dataSourceUtils';
import { evaluateExpression, type EvaluateExpressionContext } from './reportUtils';
import { richTextToHtml } from './richTextUtils';

export function buildChartExpressionContext(
  data: Record<string, unknown[]>,
  dataSourceCatalog?: DataSourceCatalog,
  row?: Record<string, unknown>
): EvaluateExpressionContext {
  return { data, dataSourceCatalog, row };
}

export function renderChartRichTextHtml(
  content: string | undefined,
  context: EvaluateExpressionContext
): string {
  if (!content?.trim()) return '';
  const evaluated = evaluateExpression(content, context);
  return richTextToHtml(evaluated);
}

export function usesCustomChartLegend(chartProps: {
  legendMode?: 'auto' | 'custom';
  legendContent?: string;
}): boolean {
  return chartProps.legendMode === 'custom' && Boolean(chartProps.legendContent?.trim());
}
