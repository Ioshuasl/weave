import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isSaving?: boolean;
  canSave: boolean;
  onSaveAndExit: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  isSaving = false,
  canSave,
  onSaveAndExit,
  onDiscard,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-neutral-900/30 flex items-center justify-center p-6 backdrop-blur-sm"
      onClick={isSaving ? undefined : onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-neutral-200/80 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-desc"
      >
        <div className="p-4 border-b border-neutral-100 flex items-start justify-between gap-3 bg-[#fbfbfa]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 ring-1 ring-amber-600/15">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h2
                id="unsaved-changes-title"
                className="text-[15px] font-semibold text-neutral-800"
              >
                Alterações não salvas
              </h2>
              <p id="unsaved-changes-desc" className="text-[13px] text-neutral-600 mt-1 leading-relaxed">
                Deseja salvar as alterações feitas no editor de layout antes de sair?
              </p>
              {!canSave && (
                <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
                  Nenhum destino de salvamento configurado — use Exportar relatório na sidebar ou
                  configure <code className="font-mono text-neutral-600">onSave</code> no host.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
            aria-label="Cancelar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 rounded-md text-[13px] font-medium text-neutral-700 border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="px-4 py-2 rounded-md text-[13px] font-medium text-neutral-700 border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40"
          >
            Sair sem salvar
          </button>
          {canSave && (
            <button
              type="button"
              onClick={onSaveAndExit}
              disabled={isSaving}
              className={cn(
                'px-4 py-2 rounded-md text-[13px] font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60',
                isSaving && 'cursor-wait'
              )}
            >
              {isSaving ? 'Salvando…' : 'Salvar e sair'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
