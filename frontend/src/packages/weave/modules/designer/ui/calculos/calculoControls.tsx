import React from 'react';
import { cn } from '../../../../shared/ui/cn';

export const inputClass = cn(
  'h-7 min-w-0 px-2 text-[12px] text-neutral-900 bg-weave-surface border border-neutral-200 rounded-md',
  'hover:border-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/8',
  'placeholder:text-neutral-400'
);

export const labelClass = 'text-[11px] font-medium text-neutral-500';

interface TokenSelectProps {
  campos: string[];
  nomes: string[];
  placeholder: string;
  onPick: (token: string) => void;
  className?: string;
}

/** Lista de campos (`[campo]`) e cálculos (pelo nome) para inserir em uma fórmula. */
export function TokenSelect({ campos, nomes, placeholder, onPick, className }: TokenSelectProps) {
  return (
    <select
      className={cn(inputClass, 'cursor-pointer', className)}
      value=""
      aria-label={placeholder}
      onChange={(event) => event.target.value && onPick(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {nomes.length > 0 && (
        <optgroup label="Cálculos">
          {nomes.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="Campos">
        {campos.map((campo) => (
          <option key={campo} value={`[${campo}]`}>
            {campo}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

interface FieldSelectProps {
  value: string;
  campos: string[];
  onChange: (campo: string) => void;
}

export function FieldSelect({ value, campos, onChange }: FieldSelectProps) {
  const options = campos.includes(value) || value === '' ? campos : [value, ...campos];
  return (
    <select className={cn(inputClass, 'cursor-pointer min-w-0 flex-1')} value={value} onChange={(event) => onChange(event.target.value)}>
      {value === '' && <option value="">Escolha o campo</option>}
      {options.map((campo) => (
        <option key={campo} value={campo}>
          {campo}
        </option>
      ))}
    </select>
  );
}
