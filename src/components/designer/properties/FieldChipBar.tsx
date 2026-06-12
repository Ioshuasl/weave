import React, { useMemo } from 'react';
import type { DataFieldOption } from '../../../utils/reportUtils';
import type { DataSourceCatalog } from '../../../utils/dataSourceUtils';
import { readRecentFieldTokens } from '../../../utils/fieldRecentStorage';
import { resolveFieldTokenPreview } from '../../../utils/fieldTokenUtils';
import { useDesignerCompactMode } from '../designerLayoutContext';
import { cn } from '../../../utils/cn';

const MAX_CHIPS = 8;
const PINNED_SINGLETON_COUNT = 4;

export function FieldChipBar({
  singletons,
  data,
  dataSourceCatalog,
  reportId,
  recentVersion = 0,
  onInsert,
}: {
  singletons: DataFieldOption[];
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  reportId?: string;
  recentVersion?: number;
  onInsert: (token: string) => void;
}) {
  const compactMode = useDesignerCompactMode();

  const chips = useMemo(() => {
    const recent = readRecentFieldTokens(reportId);
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
      preview: resolveFieldTokenPreview(token, data, dataSourceCatalog),
      label: token.slice(1, -1),
    }));
  }, [singletons, reportId, recentVersion, data, dataSourceCatalog]);

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
            title={chip.preview ? `${chip.token} — ${chip.preview}` : chip.token}
            onClick={() => onInsert(chip.token)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1 rounded-full border transition-colors',
              'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300',
              compactMode ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
            )}
          >
            <span className="font-mono opacity-80">{chip.label}</span>
            {chip.preview && (
              <span className="text-indigo-600/80 truncate max-w-[7rem]">{chip.preview}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
