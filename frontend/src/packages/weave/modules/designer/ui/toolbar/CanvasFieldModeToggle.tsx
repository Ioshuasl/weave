import { Braces, Eye } from 'lucide-react';
import React from 'react';
import { cn } from '../../../../shared/ui/cn';
import type { CanvasFieldMode } from '../canvas/canvasFieldModeContext';

const OPTIONS: { mode: CanvasFieldMode; label: string; title: string; icon: typeof Eye }[] = [
  { mode: 'data', label: 'Dados', title: 'Mostrar a folha com dados de exemplo', icon: Eye },
  { mode: 'fields', label: 'Campos', title: 'Mostrar de onde vem cada campo', icon: Braces },
];

/** Alterna a folha entre dados de exemplo e nomes dos campos. */
export function CanvasFieldModeToggle({
  mode,
  onChange,
}: {
  mode: CanvasFieldMode;
  onChange: (mode: CanvasFieldMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Exibição dos campos na folha"
      data-tour="field-mode"
      className="bg-weave-surface flex items-center rounded-lg border border-neutral-200 p-0.5"
    >
      {OPTIONS.map(({ mode: option, label, title, icon: Icon }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={mode === option}
          title={title}
          onClick={() => onChange(option)}
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition-colors',
            mode === option
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
