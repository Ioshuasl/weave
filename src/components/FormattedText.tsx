import React, { useMemo } from 'react';
import { richTextToHtml } from '../utils/richTextUtils';
import { cn } from '../utils/cn';

interface FormattedTextProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Renderiza conteúdo em markdown inline (subset) */
export const FormattedText = React.memo(function FormattedText({
  content,
  className,
  style,
}: FormattedTextProps) {
  const html = useMemo(() => richTextToHtml(content), [content]);

  if (!html) {
    return (
      <span className={cn('min-w-0', className)} style={style}>
        {content}
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
