import { ClipboardPaste, Copy, Trash2, type LucideIcon } from 'lucide-react';
import React from 'react';
import { cn } from '../../../../../shared/ui/cn';

function ActionButton({
  icon: Icon,
  label,
  title,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  title?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      className={cn(
        'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] transition-colors',
        danger
          ? 'text-neutral-500 hover:bg-red-50 hover:text-red-600'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Ações do elemento selecionado (copiar, duplicar, colar, excluir) numa única linha discreta. */
export function PropertyActionBar({
  onCopy,
  onDuplicate,
  onPaste,
  onRemove,
  canPaste,
}: {
  onCopy?: () => void;
  onDuplicate: () => void;
  onPaste?: () => void;
  onRemove: () => void;
  canPaste?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-t border-neutral-100 pt-3">
      {onCopy && <ActionButton icon={Copy} label="Copiar" title="Copiar (Ctrl+C)" onClick={onCopy} />}
      <ActionButton icon={Copy} label="Duplicar" title="Duplicar (Ctrl+D)" onClick={onDuplicate} />
      {canPaste && onPaste && (
        <ActionButton icon={ClipboardPaste} label="Colar" title="Colar (Ctrl+V)" onClick={onPaste} />
      )}
      <ActionButton icon={Trash2} label="Excluir" onClick={onRemove} danger />
    </div>
  );
}
