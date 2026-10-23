import { Calculator, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../../shared/ui/cn';
import { CalculosPanel } from '../calculos/CalculosPanel';
import { SIDEBAR_WIDTH_CLASS } from '../layout/designerLayout';
import { SidebarContent } from './SidebarContent';
import { SidebarFlyout } from './SidebarFlyout';
import { WeaveLogo } from './WeaveLogo';

interface SidebarProps {
  reportName?: string;
  onClose?: () => void;
}

export const Sidebar = ({ reportName, onClose }: SidebarProps) => {
  const [calculosOpen, setCalculosOpen] = useState(false);

  return (
    <>
      <aside
        data-tour="sidebar"
        className={cn(
          SIDEBAR_WIDTH_CLASS,
          'bg-weave-surface z-10 flex h-full flex-col border-r border-neutral-200 select-none',
        )}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-3 py-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Voltar ao sistema"
              aria-label="Voltar ao sistema"
              className="-ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <WeaveLogo />
            <p className="sr-only" title={reportName}>
              {reportName ?? 'Designer'}
            </p>
          </div>
        </div>

        <div className="shrink-0 border-b border-neutral-200 px-3 py-2">
          <button
            type="button"
            onClick={() => setCalculosOpen((open) => !open)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors',
              calculosOpen
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-neutral-700 hover:bg-neutral-100',
            )}
          >
            <Calculator className="h-4 w-4 shrink-0" />
            Cálculos
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      <SidebarFlyout
        isOpen={calculosOpen}
        onClose={() => setCalculosOpen(false)}
        title="Cálculos"
        wide
        leftClassName="left-[200px] min-[1440px]:left-60"
      >
        <CalculosPanel />
      </SidebarFlyout>
    </>
  );
};
