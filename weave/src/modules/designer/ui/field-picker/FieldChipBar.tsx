import React, { useMemo } from 'react';
import type { DataFieldOption } from '../../../expression/domain';
import { useDesignerCompactMode } from '../layout/designerLayoutContext';
import { cn } from '../../../../shared/ui/cn';
import { useDesignerServices } from '../services/DesignerServicesContext';

const MAX_CHIPS = 8;
const PINNED_SINGLETON_COUNT = 4;

export function FieldChipBar({
  singletons,
  reportId,
  recentVersion = 0,
  onInsert,
}: {
  singletons: DataFieldOption[];
  reportId?: string;
  recentVersion?: number;
  onInsert: (token: string) => void;
}) {
  const compactMode = useDesignerCompactMode();
  const { recentFields } = useDesignerServices();

  const chips = useMemo(() => {
    const recent = recentFields.read(reportId);
    const pinned = singletons.slice(0, PINNED_SINGLETON_COUNT).map((opt) => opt.value);
    const seen = new Set<string>();
    const tokens: string[] = [];

    for (const token of [...recent, ...pinned]) {
      if (seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
      if (tokens.length >= MAX_CHIPS) break;
    }

    return tokens.map((token) => ({
      token,
      label: token.slice(1, -1),
    }));
  }, [recentFields, singletons, reportId, recentVersion]);

  if (chips.length === 0) return null;

  return (
    <div className="space-y-1.5 min-w-0">
      <span
        className={cn(
          'block font-medium text-neutral-600',
          compactMode ? 'text-[10px]' : 'text-[11px]'
        )}
      >
        Inserir rápido
      </span>
      <div
        className={cn(
          'flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5',
          '[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1'
        )}
      >
        {chips.map((chip) => (
          <button
            key={chip.token}
            type="button"
            title={chip.token}
            onClick={() => onInsert(chip.token)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1 rounded-full border transition-colors',
              'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300',
              compactMode ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
            )}
          >
            <span className="font-mono opacity-80">{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
