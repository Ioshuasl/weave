import { type ReactNode } from 'react';
import { Settings, type LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useDesignerCompactMode } from '../designerLayoutContext';

export function PropertiesPanelShell({
  title,
  icon: Icon = Settings,
  variant = 'selection',
  breadcrumb,
  trailing,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  variant?: 'selection' | 'page' | 'empty';
  breadcrumb?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const compactMode = useDesignerCompactMode();
  const isSelection = variant === 'selection';

  return (
    <div
      data-tour="properties"
      className={cn(
        'flex-1 min-h-0 min-w-0 max-w-full flex flex-col w-full overflow-hidden h-full',
        isSelection ? 'bg-white shadow-sm z-10' : 'bg-[#fbfbfa]'
      )}
    >
      <div
        className={cn(
          'border-b border-neutral-100 bg-[#fbfbfa] shrink-0',
          compactMode ? 'px-2 py-2' : 'px-3 py-3'
        )}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon
              className={cn('text-neutral-400 shrink-0', compactMode ? 'w-3.5 h-3.5' : 'w-4 h-4')}
            />
            <h3
              className={cn(
                'font-semibold text-neutral-700 truncate',
                compactMode ? 'text-[12px]' : 'text-[13px]'
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
