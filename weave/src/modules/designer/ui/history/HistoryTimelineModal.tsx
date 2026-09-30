import React, { useEffect, useRef } from 'react';
import {
  Clock,
  Database,
  FileInput,
  Layers,
  LayoutTemplate,
  Minus,
  Move,
  Palette,
  Plus,
  Redo2,
  Table2,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import { type HistoryActionKind, type HistoryEntry, formatHistoryRelative, formatHistoryTime } from '../../../history/domain';
import { cn } from '../../../../shared/ui/cn';

interface HistoryTimelineModalProps {
  onClose: () => void;
}

const KIND_ICONS: Record<HistoryActionKind, React.ComponentType<{ className?: string }>> = {
  init: Clock,
  import: FileInput,
  addBand: Plus,
  removeBand: Trash2,
  updateBand: Layers,
  addComponent: Plus,
  removeComponent: Trash2,
  duplicateBand: Layers,
  duplicateComponent: Type,
  pasteComponent: Plus,
  updateComponent: Type,
  editData: Database,
  editPage: LayoutTemplate,
};

function HistoryIcon({ kind, label }: { kind: HistoryActionKind; label: string }) {
  const Icon = KIND_ICONS[kind] ?? Move;
  if (label.includes('linha divisória') || label.includes('Linha')) {
    return <Minus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />;
  }
  if (label.includes('tabela') || label.includes('Tabela')) {
    return <Table2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />;
  }
  if (label.includes('Estilo') || label.includes('Cor')) {
    return <Palette className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />;
  }
  return <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />;
}

function TimelineRow({
  entry,
  index,
  isCurrent,
  isFuture,
  onSelect,
}: {
  entry: HistoryEntry;
  index: number;
  isCurrent: boolean;
  isFuture: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors',
        isCurrent
          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
          : isFuture
            ? 'bg-neutral-50/80 text-neutral-400 border-dashed border-neutral-200 hover:bg-neutral-100 hover:text-neutral-600'
            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex items-center justify-center w-7 h-7 rounded-md shrink-0',
          isCurrent ? 'bg-white/15' : 'bg-neutral-100 text-neutral-500'
        )}
      >
        <HistoryIcon kind={entry.kind} label={entry.label} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[13px] font-medium truncate', isCurrent && 'text-white')}>
          {entry.label}
        </p>
        <p
          className={cn(
            'text-[11px] mt-0.5 tabular-nums',
            isCurrent ? 'text-white/70' : 'text-neutral-400'
          )}
        >
          {formatHistoryTime(entry.timestamp)} · {formatHistoryRelative(entry.timestamp)}
        </p>
      </div>
      {isCurrent && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80 shrink-0 mt-1">
          Atual
        </span>
      )}
      {isFuture && (
        <span className="text-[10px] uppercase tracking-wide text-neutral-400 shrink-0 mt-1">
          Refazer
        </span>
      )}
    </button>
  );
}

export const HistoryTimelineModal: React.FC<HistoryTimelineModalProps> = ({ onClose }) => {
  const historyPast = useDesignerStore((state) => state.historyPast);
  const historyPointer = useDesignerStore((state) => state.historyPointer);
  const undo = useDesignerStore((state) => state.undo);
  const redo = useDesignerStore((state) => state.redo);
  const jumpToHistory = useDesignerStore((state) => state.jumpToHistory);
  const canUndo = useDesignerStore((state) => state.historyPointer > 0);
  const canRedo = useDesignerStore(
    (state) => state.historyPointer < state.historyPast.length - 1
  );
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-history-current="true"]');
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [historyPointer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/30 flex items-center justify-center p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-neutral-200/80 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-100 flex items-start justify-between gap-3 shrink-0 bg-[#fbfbfa]">
          <div>
            <h2 className="text-[15px] font-semibold text-neutral-800">Histórico de alterações</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Clique em um ponto da linha do tempo para restaurar o layout nesse momento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-1.5 min-h-0">
          {historyPast.map((entry, index) => (
            <div key={entry.id} data-history-current={index === historyPointer ? 'true' : undefined}>
              <TimelineRow
                entry={entry}
                index={index}
                isCurrent={index === historyPointer}
                isFuture={index > historyPointer}
                onSelect={() => jumpToHistory(index)}
              />
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-neutral-100 flex items-center gap-2 shrink-0 bg-[#fbfbfa]">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Undo2 className="w-4 h-4" />
            Desfazer
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Redo2 className="w-4 h-4" />
            Refazer
          </button>
        </div>

        <p className="px-4 pb-3 text-[10px] text-neutral-400 text-center shrink-0">
          Ctrl+Z desfazer · Ctrl+Shift+Z refazer · Ctrl+H abrir histórico
        </p>
      </div>
    </div>
  );
};
