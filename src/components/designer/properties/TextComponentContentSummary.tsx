import React, { useMemo } from 'react';
import { PencilLine } from 'lucide-react';
import type { ReportComponent } from '../../../types/report';
import type { DataSourceCatalog } from '../../../utils/dataSourceUtils';
import { evaluateExpression } from '../../../utils/reportUtils';
import { DESIGN_MODE_SYSTEM_VARIABLES } from '../../../utils/systemVariables';
import { mergeTextEditorDraftStyle } from '../../../utils/textEditorModalUtils';
import { useDesignerStore } from '../../../store/designerStore';
import { FormattedText } from '../../FormattedText';
import { cn } from '../../../utils/cn';

export function TextComponentContentSummary({
  component,
  componentId,
  data,
  dataSourceCatalog,
}: {
  component: ReportComponent;
  componentId: string;
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
}) {
  const openTextEditorModal = useDesignerStore((state) => state.openTextEditorModal);
  const textEditorModal = useDesignerStore((state) => state.textEditorModal);
  const isEditorOpenForThis = textEditorModal?.componentId === componentId;
  const isBlockedByOtherEditor =
    textEditorModal != null && textEditorModal.componentId !== componentId;

  const liveDraft = isEditorOpenForThis ? textEditorModal?.draft : null;
  const displayContent = liveDraft?.content ?? component.content;
  const displayStyle = mergeTextEditorDraftStyle(component.style, liveDraft);

  const previewContent = useMemo(
    () =>
      evaluateExpression(displayContent, {
        sys: DESIGN_MODE_SYSTEM_VARIABLES,
        data,
        dataSourceCatalog,
      }),
    [displayContent, data, dataSourceCatalog]
  );

  const hasContent = displayContent.trim().length > 0;

  return (
    <div className="space-y-3 min-w-0">
      <div
        className={cn(
          'rounded-md border border-neutral-200 bg-neutral-50/80 px-2.5 py-2 min-h-[3.5rem] max-h-28 overflow-hidden',
          isEditorOpenForThis && 'ring-2 ring-indigo-300/60 border-indigo-200/80'
        )}
      >
        {hasContent ? (
          <FormattedText
            content={previewContent}
            className="text-[13px] leading-relaxed line-clamp-5 break-words [overflow-wrap:anywhere]"
            style={{
              color: displayStyle.color,
              fontSize: displayStyle.fontSize,
              textAlign: displayStyle.textAlign,
            }}
          />
        ) : (
          <p className="text-[13px] text-neutral-400 italic">Sem texto</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => openTextEditorModal(componentId)}
        disabled={isBlockedByOtherEditor}
        title={
          isBlockedByOtherEditor
            ? 'Feche o editor aberto antes de editar outro texto'
            : undefined
        }
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium',
          'border transition-colors',
          isBlockedByOtherEditor && 'opacity-50 cursor-not-allowed',
          isEditorOpenForThis
            ? 'border-neutral-300 bg-neutral-100 text-neutral-700'
            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300',
          isBlockedByOtherEditor && !isEditorOpenForThis && 'hover:bg-white hover:border-neutral-200'
        )}
      >
        <PencilLine className="w-3.5 h-3.5 shrink-0" />
        {isEditorOpenForThis ? 'Editor aberto' : 'Editar texto…'}
      </button>

      <p className="text-[11px] text-neutral-400 leading-snug">
        {isBlockedByOtherEditor ? (
          <>Feche o editor aberto para editar este texto.</>
        ) : (
          <>
            Duplo-clique no canvas ou{' '}
            <kbd className="font-mono text-[10px] px-1 py-px rounded bg-neutral-100 border border-neutral-200">
              F2
            </kbd>
          </>
        )}
      </p>
    </div>
  );
}
