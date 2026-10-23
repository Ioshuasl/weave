import { Settings, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../../../shared/ui/cn';
import { useDesignerCompactMode } from '../layout/designerLayoutContext';

export function PropertiesPanelShell({
  title,
  icon: Icon = Settings,
  variant = 'selection',
  breadcrumb,
  trailing,
  scrollResetKey,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  variant?: 'selection' | 'page' | 'empty';
  breadcrumb?: ReactNode;
  trailing?: ReactNode;
  /** Quando muda (ex.: outra seleção), o conteúdo volta ao topo. */
  scrollResetKey?: string | null;
  children?: ReactNode;
}) {
  const compactMode = useDesignerCompactMode();
  const isSelection = variant === 'selection';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [scrollResetKey]);

  return (
    <div
      data-tour="properties"
      className={cn(
        'flex-1 min-h-0 min-w-0 max-w-full flex flex-col w-full overflow-hidden h-full',
        'bg-weave-surface'
      )}
    >
      <div
        className={cn(
          'border-b border-neutral-200 bg-weave-surface shrink-0',
          compactMode ? 'px-2 py-2' : 'px-3 py-3'
        )}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon
              className={cn('text-indigo-600 shrink-0', compactMode ? 'w-3.5 h-3.5' : 'w-4 h-4')}
            />
            <h3
              className={cn(
                'font-semibold text-neutral-900 truncate',
                compactMode ? 'text-[13px]' : 'text-sm'
              )}
            >
              {title}
            </h3>
          </div>
          {trailing}
        </div>
        {breadcrumb && <div className="mt-1 min-w-0 pl-6">{breadcrumb}</div>}
      </div>

      {children != null && (
        <div
          ref={scrollRef}
          className={cn(
            'flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain',
            compactMode ? 'p-3 space-y-4' : 'p-4 space-y-6'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
