import { PencilLine } from 'lucide-react';
import React, { useCallback } from 'react';
import { cn } from '../../../../../shared/ui/cn';
import { escapeHtml } from '../../../../components/text/domain';
import { FormattedText } from '../../../../components/text/ui';
import { useDataSourceCatalog } from '../../../../data-source/ui';
import { getFieldTokenLabel } from '../../../../expression/domain';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';
import { mergeTextEditorDraftStyle } from '../../../domain/textEditorModal';
import type { ReportComponent } from '../../../../components/common/domain';

export function TextComponentContentSummary({
  component,
  componentId,
}: {
  component: ReportComponent;
  componentId: string;
}) {
  const openTextEditorModal = useDesignerStore((state) => state.openTextEditorModal);
  const dataSourceCatalog = useDataSourceCatalog();
  const renderFieldLabel = useCallback(
    (token: string) =>
      `<span class="weave-field">${escapeHtml(getFieldTokenLabel(token, dataSourceCatalog))}</span>`,
    [dataSourceCatalog]
  );
  const textEditorModal = useDesignerStore((state) => state.textEditorModal);
  const isEditorOpenForThis = textEditorModal?.componentId === componentId;
  const isBlockedByOtherEditor =
    textEditorModal != null && textEditorModal.componentId !== componentId;

  const liveDraft = isEditorOpenForThis ? textEditorModal?.draft : null;
  const displayContent = liveDraft?.content ?? component.content;
  const displayStyle = mergeTextEditorDraftStyle(component.style, liveDraft);

  const hasContent = displayContent.trim().length > 0;

  return (
    <div className="space-y-3 min-w-0">
      <div
        className={cn(
          'min-h-[3.5rem] max-h-28 overflow-hidden rounded-lg bg-neutral-100/70 px-3 py-2.5',
          isEditorOpenForThis && 'ring-2 ring-indigo-300/60'
        )}
      >
        {hasContent ? (
          <FormattedText
            content={displayContent}
            renderField={renderFieldLabel}
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
          'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
          isBlockedByOtherEditor && 'cursor-not-allowed opacity-50',
          isEditorOpenForThis
            ? 'bg-neutral-100 text-neutral-700'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
          isBlockedByOtherEditor && 'hover:bg-indigo-50'
        )}
      >
        <PencilLine className="w-3.5 h-3.5 shrink-0" />
        {isEditorOpenForThis ? 'Editor aberto' : 'Editar texto'}
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
