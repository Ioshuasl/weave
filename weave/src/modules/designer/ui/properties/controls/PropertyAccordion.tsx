import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../../../shared/ui/cn';

function readStoredOpen(storageKey: string | null, defaultOpen: boolean): boolean {
  if (!storageKey) return defaultOpen;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) return stored === 'true';
  } catch {
    /* ignore */
  }
  return defaultOpen;
}

export function PropertyAccordion({
  title,
  icon: Icon,
  badge,
  sectionId,
  reportId,
  defaultOpen = true,
  children,
  className,
  headingClassName,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  sectionId: string;
  reportId?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headingClassName?: string;
}) {
  const storageKey = reportId ? `properties-panel.accordion.${reportId}.${sectionId}` : null;
  const [open, setOpen] = useState(() => readStoredOpen(storageKey, defaultOpen));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className={cn('min-w-0 max-w-full', className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-1.5 text-left rounded-md -mx-1 px-1 py-1',
          'hover:bg-neutral-50 transition-colors',
          headingClassName
        )}
      >
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 shrink-0 text-neutral-400 transition-transform',
            open && 'rotate-90'
          )}
          aria-hidden
        />
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-neutral-400" aria-hidden />}
        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest truncate">
          {title}
        </span>
        {badge !== undefined && (
          <span className="ml-auto shrink-0 text-[10px] font-medium text-neutral-400 tabular-nums">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="pt-3 space-y-3 min-w-0">{children}</div>}
    </div>
  );
}
