import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Type, X } from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import { buildGroupedDataFieldOptions } from '../../utils/reportUtils';
import { DESIGNER_MODAL_OVERLAY_Z } from '../../utils/designerZIndex';
import { isTextEditorModalDirty } from '../../utils/textEditorModalUtils';
import { useDataSourceCatalog } from './designerHostContext';
import { TextComponentEditorBody } from './TextComponentEditorBody';
import { PropertiesPanelBreadcrumb } from './properties/PropertiesPanelBreadcrumb';
import { cn } from '../../utils/cn';

export function TextComponentEditorModal() {
  const textEditorModal = useDesignerStore((state) => state.textEditorModal);
  const report = useDesignerStore((state) => state.report);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const data = useDesignerStore((state) => state.data);
  const dataSourceCatalog = useDataSourceCatalog();
  const closeTextEditorModal = useDesignerStore((state) => state.closeTextEditorModal);
  const patchTextEditorDraft = useDesignerStore((state) => state.patchTextEditorDraft);
  const commitTextEditorModal = useDesignerStore((state) => state.commitTextEditorModal);

  const editorHandleRef = useRef<{ focus: () => void } | null>(null);
  const pointerDownOnOverlayRef = useRef(false);
  const pointerDownInEditorRef = useRef(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const componentId = textEditorModal?.componentId;
  const component = componentId ? report.components[componentId] : null;
  const draft = textEditorModal?.draft;

  const page =
    report.pages.find((p) => p.id === activePageId) ?? report.pages[0] ?? null;
  const band = component ? report.bands[component.parentId] : null;
  const groupedDataFields = buildGroupedDataFieldOptions(data, dataSourceCatalog);

  const requestClose = useCallback(() => {
    if (!textEditorModal) return;
    if (isTextEditorModalDirty(textEditorModal)) {
      setDiscardConfirmOpen(true);
      return;
    }
    closeTextEditorModal();
  }, [closeTextEditorModal, textEditorModal]);

  const confirmDiscard = useCallback(() => {
    setDiscardConfirmOpen(false);
    closeTextEditorModal();
  }, [closeTextEditorModal]);

  const handleOverlayPointerDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    pointerDownOnOverlayRef.current = event.target === event.currentTarget;
    pointerDownInEditorRef.current = Boolean(
      (event.target as HTMLElement | null)?.closest('[contenteditable="true"]')
    );
  }, []);

  const restoreEditorFocusWithSelection = useCallback(() => {
    const selection = window.getSelection();
    const ranges =
      selection && selection.rangeCount > 0
        ? Array.from({ length: selection.rangeCount }, (_, i) =>
            selection.getRangeAt(i).cloneRange()
          )
        : [];
    editorHandleRef.current?.focus();
    if (!selection || ranges.length === 0) return;
    selection.removeAllRanges();
    for (const range of ranges) selection.addRange(range);
  }, []);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (!pointerDownOnOverlayRef.current) {
        event.preventDefault();
        if (pointerDownInEditorRef.current) {
          restoreEditorFocusWithSelection();
        }
        return;
      }
      requestClose();
    },
    [requestClose, restoreEditorFocusWithSelection]
  );

  useEffect(() => {
    if (!textEditorModal) {
      setDiscardConfirmOpen(false);
    }
  }, [textEditorModal]);

  useEffect(() => {
    if (!textEditorModal || discardConfirmOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [discardConfirmOpen, requestClose, textEditorModal]);

  useEffect(() => {
    if (!textEditorModal || discardConfirmOpen) return;
    const frame = window.requestAnimationFrame(() => {
      editorHandleRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [discardConfirmOpen, textEditorModal?.componentId]);

  if (!textEditorModal || !component || component.type !== 'text' || !draft) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-neutral-900/30 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm select-none"
      style={{ zIndex: DESIGNER_MODAL_OVERLAY_Z }}
      onMouseDown={handleOverlayPointerDown}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'bg-white rounded-xl shadow-xl border border-neutral-200/80 w-full max-w-2xl',
          'max-h-[min(90vh,720px)] flex flex-col overflow-hidden relative select-text'
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-editor-modal-title"
      >
        <div className="p-4 border-b border-neutral-100 flex items-start justify-between gap-3 bg-[#fbfbfa] shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 ring-1 ring-neutral-900/5">
              <Type className="w-4 h-4 text-neutral-700" />
            </div>
            <div className="min-w-0">
              <h2
                id="text-editor-modal-title"
                className="text-[15px] font-semibold text-neutral-800"
              >
                Editar texto
              </h2>
              <PropertiesPanelBreadcrumb
                band={band}
                pageName={page?.name ?? ''}
                className="text-[12px] mt-0.5"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <TextComponentEditorBody
            content={draft.content}
            onContentChange={(content) => patchTextEditorDraft({ content })}
            fontSize={draft.fontSize}
            onFontSizeChange={(fontSize) => patchTextEditorDraft({ fontSize })}
            color={draft.color}
            onColorChange={(color) => patchTextEditorDraft({ color })}
            textAlign={draft.textAlign}
            onTextAlignChange={(textAlign) => patchTextEditorDraft({ textAlign })}
            data={data}
            dataSourceCatalog={dataSourceCatalog}
            reportId={report.id}
            groupedDataFields={groupedDataFields}
            onEditorReady={(handle) => {
              editorHandleRef.current = handle;
            }}
            editorMinHeight="12rem"
            placeholder="Digite o texto do relatório"
          />
        </div>

        <div className="p-4 border-t border-neutral-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0 bg-white">
          <button
            type="button"
            onClick={requestClose}
            className="px-4 py-2 rounded-md text-[13px] font-medium text-neutral-700 border border-neutral-200 bg-white hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={commitTextEditorModal}
            className="px-4 py-2 rounded-md text-[13px] font-medium text-white bg-neutral-900 hover:bg-neutral-800"
          >
            Salvar
          </button>
        </div>

        {discardConfirmOpen && (
          <div
            className="absolute inset-0 z-10 bg-white/95 backdrop-blur-[1px] flex items-center justify-center p-6"
            role="alertdialog"
            aria-labelledby="text-editor-discard-title"
            aria-describedby="text-editor-discard-desc"
          >
            <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white shadow-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 ring-1 ring-amber-600/15">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="text-editor-discard-title"
                    className="text-[14px] font-semibold text-neutral-800"
                  >
                    Descartar alterações?
                  </h3>
                  <p
                    id="text-editor-discard-desc"
                    className="text-[13px] text-neutral-600 mt-1 leading-relaxed"
                  >
                    Há alterações não salvas neste texto. Deseja fechar sem salvar?
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDiscardConfirmOpen(false)}
                  className="px-4 py-2 rounded-md text-[13px] font-medium text-neutral-700 border border-neutral-200 bg-white hover:bg-neutral-50"
                >
                  Continuar editando
                </button>
                <button
                  type="button"
                  onClick={confirmDiscard}
                  className="px-4 py-2 rounded-md text-[13px] font-medium text-white bg-neutral-900 hover:bg-neutral-800"
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
