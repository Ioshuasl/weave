import React from 'react';
import { GripVertical, Trash2, Type, Copy, ClipboardPaste } from 'lucide-react';
import { cn } from '../../../../../shared/ui/cn';

interface BandToolbarProps {
  label: string;
  meta?: string;
  showAddText?: boolean;
  onAddText?: () => void;
  onDuplicate?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  /** Arrasto manual (ex.: banda Linha) — quando definido, substitui o grip do react-draggable */
  onGripPointerDown?: (e: React.PointerEvent) => void;
  /** Seleção no grip sem iniciar arrasto (ex.: clique simples na banda) */
  onGripSelect?: (e: React.PointerEvent) => void;
  className?: string;
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-neutral-200/90 shrink-0 mx-0.5" aria-hidden />;
}

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  onPointerDown,
  variant = 'default',
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  variant?: 'default' | 'danger';
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={cn(
        'no-drag flex items-center justify-center w-7 h-7 rounded-md transition-colors',
        variant === 'danger'
          ? 'text-neutral-500 hover:text-red-600 hover:bg-red-50'
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
    </button>
  );
}

function stopBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

const toolbarPanelClass = cn(
  'flex items-center gap-0.5 pl-0.5 pr-1 py-0.5',
  'rounded-lg border border-neutral-200/90',
  'bg-white/95 backdrop-blur-sm',
  'shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)]'
);

/** Barra flutuante minimalista (estilo Notion) para bandas selecionadas */
export const BandToolbar: React.FC<BandToolbarProps> = ({
  label,
  meta,
  showAddText,
  onAddText,
  onDuplicate,
  onPaste,
  onDelete,
  onGripPointerDown,
  onGripSelect,
  className,
}) => {
  return (
    <div
      className={cn(
        'band-toolbar absolute -top-9 left-0 z-50 pointer-events-auto flex items-stretch gap-0.5',
        className
      )}
    >
      {/* Grip FORA de .no-drag — senão react-draggable cancela o arrasto */}
      <div className={toolbarPanelClass}>
        <div
          role="button"
          tabIndex={-1}
          className={cn(
            'flex items-center justify-center touch-none select-none',
            'w-7 h-7 rounded-md cursor-grab active:cursor-grabbing',
            'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors',
            !onGripPointerDown && 'band-drag-handle'
          )}
          title="Arrastar banda"
          aria-label="Arrastar banda"
          onPointerDown={(e) => {
            onGripSelect?.(e);
            onGripPointerDown?.(e);
          }}
        >
          <GripVertical className="w-3.5 h-3.5 pointer-events-none" strokeWidth={2} />
        </div>
      </div>

      <div
        className={cn('no-drag band-toolbar-actions', toolbarPanelClass)}
        onPointerDown={stopBubble}
        onClick={stopBubble}
      >
        <span className="text-[11px] font-medium text-neutral-600 px-1.5 select-none whitespace-nowrap">
          {label}
        </span>

        {meta && (
          <span className="text-[10px] text-neutral-400 select-none whitespace-nowrap pr-0.5">
            {meta}
          </span>
        )}

        {(showAddText || onDuplicate || onPaste || onDelete) && <ToolbarDivider />}

        {showAddText && onAddText && (
          <ToolbarIconButton
            icon={Type}
            label="Adicionar texto"
            onPointerDown={stopBubble}
            onClick={onAddText}
          />
        )}

        {onDuplicate && (
          <ToolbarIconButton
            icon={Copy}
            label="Duplicar banda (Ctrl+D)"
            onPointerDown={stopBubble}
            onClick={onDuplicate}
          />
        )}

        {onPaste && (
          <ToolbarIconButton
            icon={ClipboardPaste}
            label="Colar componente (Ctrl+V)"
            onPointerDown={stopBubble}
            onClick={onPaste}
          />
        )}

        {onDelete && (
          <ToolbarIconButton
            icon={Trash2}
            label="Excluir banda"
            variant="danger"
            onPointerDown={stopBubble}
            onClick={onDelete}
          />
        )}
      </div>
    </div>
  );
};
