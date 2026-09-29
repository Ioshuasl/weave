import { ChevronLeft, LayoutTemplate } from 'lucide-react';
import { cn } from '../../../../shared/ui/cn';
import { SIDEBAR_WIDTH_CLASS } from '../layout/designerLayout';
import { SidebarContent } from './SidebarContent';

interface SidebarProps {
  reportName?: string;
  onClose?: () => void;
}

export const Sidebar = ({ reportName, onClose }: SidebarProps) => {
  return (
    <aside
      data-tour="sidebar"
      className={cn(
        SIDEBAR_WIDTH_CLASS,
        'bg-[#fbfbfa] border-r border-neutral-200 flex flex-col h-full select-none z-10'
      )}
    >
      <div className="px-3 py-3 border-b border-neutral-200 flex items-center gap-2 shrink-0">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Voltar ao sistema"
            aria-label="Voltar ao sistema"
            className="shrink-0 flex items-center justify-center w-8 h-8 -ml-0.5 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>
        )}
        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
          <LayoutTemplate className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm tracking-tight text-neutral-800 truncate">Weave</p>
          <p className="text-[10px] text-neutral-400 truncate" title={reportName}>
            {reportName ?? 'Designer'}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <SidebarContent />
      </div>
    </aside>
  );
};
