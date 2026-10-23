import { motion } from 'framer-motion';
import React, { useId, useState } from 'react';
import { cn } from '../../../../../shared/ui/cn';

export interface PropertyTabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

/** Abas inline (underline) do painel de propriedades. Com uma única aba, renderiza só o conteúdo. */
export function PropertyTabs({ tabs, className }: { tabs: PropertyTabItem[]; className?: string }) {
  const baseId = useId();
  const [selectedId, setSelectedId] = useState<string>(tabs[0]?.id ?? '');
  const activeTab = tabs.find((tab) => tab.id === selectedId) ?? tabs[0];

  if (!activeTab) return null;
  if (tabs.length === 1)
    return <div className={cn('min-w-0 space-y-4', className)}>{activeTab.content}</div>;

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setSelectedId(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  };

  return (
    <div className={cn('min-w-0 space-y-4', className)}>
      <div role="tablist" className="-mx-1 flex items-end border-b border-neutral-200">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setSelectedId(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[12px] transition-colors',
                'focus-visible:bg-neutral-100 focus-visible:outline-none',
                isActive
                  ? 'font-semibold text-neutral-900'
                  : 'font-medium text-neutral-500 hover:text-neutral-800',
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{tab.label}</span>
              {isActive && (
                <motion.span
                  layoutId={`${baseId}-underline`}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-indigo-600"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.id}`}
        aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        className="min-w-0 space-y-4"
      >
        {activeTab.content}
      </div>
    </div>
  );
}
