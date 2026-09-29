import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { PropertyHint } from './controls/PropertyFields';

export function MultiSelectionProperties({
  count,
  onDuplicate,
  onRemove,
}: {
  count: number;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3">
      <PropertyHint>
        {count} componentes selecionados. Arraste um deles para mover o grupo. Ctrl/Cmd+clique ou
        Shift+clique para alterar a seleção.
      </PropertyHint>
      <div className="space-y-2 pt-2 border-t border-neutral-100">
        <button
          type="button"
          onClick={onDuplicate}
          className="w-full flex items-center justify-center gap-1.5 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-md text-[13px] transition-colors border border-neutral-200"
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicar seleção
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-1.5 hover:bg-red-50 text-neutral-500 hover:text-red-600 px-3 py-2 rounded-md text-[13px] transition-colors border border-transparent hover:border-red-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir {count} componentes
        </button>
      </div>
    </div>
  );
}
