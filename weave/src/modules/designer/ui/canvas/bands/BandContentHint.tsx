import React from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { cn } from '../../../../../shared/ui/cn';

interface BandContentHintProps {
  variant: 'list' | 'numbered';
  className?: string;
}

export const BandContentHint: React.FC<BandContentHintProps> = ({ variant, className }) => (
  <div
    className={cn(
      'absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center pointer-events-none',
      className
    )}
  >
    <div className="flex items-center gap-1.5 text-neutral-400">
      <GripVertical className="w-4 h-4" />
      <Plus className="w-3.5 h-3.5" />
    </div>
    <p className="text-[11px] text-neutral-400 leading-snug max-w-[220px]">
      {variant === 'numbered'
        ? 'Arraste campos da barra lateral ou use o botão + para montar cada linha numerada.'
        : 'Arraste campos da barra lateral ou use o botão + para adicionar textos nesta linha.'}
    </p>
  </div>
);
