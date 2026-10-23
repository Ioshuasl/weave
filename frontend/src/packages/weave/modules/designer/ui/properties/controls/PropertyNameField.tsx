import { Pencil } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '../../../../../shared/ui/cn';

/** Nome do elemento (aparece nas camadas). Grava ao sair do campo ou com Enter. */
export function PropertyNameField({
  value,
  placeholder,
  onCommit,
  label = 'Nome',
}: {
  value: string;
  placeholder: string;
  onCommit: (name: string) => void;
  label?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const name = draft.trim();
    if (name !== value.trim()) onCommit(name);
    setDraft(name);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium text-neutral-600">
        {label}
      </label>
      <div className="relative">
        <Pencil className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input
          id={id}
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              setDraft(value);
              event.currentTarget.blur();
            }
          }}
          className={cn(
            'w-full min-w-0 rounded-lg border border-transparent bg-neutral-100/70 py-2 pl-9 pr-3 text-[13px] font-medium text-neutral-900 transition-[border-color,box-shadow,background-color]',
            'placeholder:font-normal placeholder:text-neutral-400 hover:bg-neutral-100',
            'focus:border-indigo-500 focus:bg-weave-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
          )}
        />
      </div>
    </div>
  );
}
