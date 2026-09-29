import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../../shared/ui/cn';
import { SIDEBAR_WIDTH_CLASS } from '../layout/designerLayout';

interface SidebarFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const SidebarFlyout: React.FC<SidebarFlyoutProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-[1px]"
        aria-label="Fechar paleta"
        onClick={onClose}
      />
      <aside
        className={cn(
          SIDEBAR_WIDTH_CLASS,
          'fixed left-12 top-0 bottom-0 z-50 bg-[#fbfbfa] border-r border-neutral-200 flex flex-col shadow-xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2.5 border-b border-neutral-200 flex items-center justify-between gap-2 shrink-0">
          <h2 className="text-[12px] font-semibold text-neutral-700 truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
      </aside>
    </>
  );
};
