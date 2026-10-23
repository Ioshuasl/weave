import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
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

/** Seção recolhível: título simples, seta que gira e conteúdo que desliza (mesmo tom da sidebar). */
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
          'group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-neutral-100',
          headingClassName
        )}
      >
        {Icon && <Icon className="size-3.5 shrink-0 text-neutral-500" aria-hidden />}
        <span className="truncate text-[13px] font-semibold text-neutral-800">{title}</span>
        {badge !== undefined && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 text-[10px] font-medium tabular-nums text-neutral-500">
            {badge}
          </span>
        )}
        <motion.span
          className="ml-auto flex shrink-0 text-neutral-400 group-hover:text-neutral-600"
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18 }}
        >
          <ChevronRight className="size-4" aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="min-w-0 space-y-3 pb-1 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
