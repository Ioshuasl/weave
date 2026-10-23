import React, { useMemo } from 'react';
import { cn } from '../../../../shared/ui/cn';
import { type FieldTokenRenderer, richTextToHtml } from '../domain/richTextUtils';

interface FormattedTextProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  /** Substitui campos `{dataset.campo}` depois do markdown (valores não viram formatação) */
  renderField?: FieldTokenRenderer;
}

/** Renderiza conteúdo em markdown inline (subset) */
export const FormattedText = React.memo(function FormattedText({
  content,
  className,
  style,
  renderField,
}: FormattedTextProps) {
  const html = useMemo(() => richTextToHtml(content, renderField), [content, renderField]);

  if (!html) {
    return (
      <span className={cn('min-w-0', className)} style={style}>
        {renderField ? null : content}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'rich-text min-w-0',
        '[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic',
        '[&_u]:underline [&_s]:line-through [&_strike]:line-through [&_del]:line-through',
        className
      )}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
