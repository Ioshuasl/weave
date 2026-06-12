import React, { useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PROPERTIES_PANEL_COLUMN_CLASS } from './designerLayout';

interface PropertiesPanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  showToggle: boolean;
  children: React.ReactNode;
}

export const PropertiesPanelDrawer: React.FC<PropertiesPanelDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
  showToggle,
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

  return (
    <>
      {showToggle && !isOpen && (
        <button
          type="button"
          onClick={onOpen}
          title="Propriedades (])"
          aria-label="Abrir painel de propriedades"
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-20',
            'flex items-center justify-center w-9 h-12 rounded-l-lg',
            'border border-r-0 border-neutral-200 bg-white/95 shadow-sm',
            'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-[1px]"
          aria-label="Fechar propriedades"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          PROPERTIES_PANEL_COLUMN_CLASS,
          'fixed right-0 top-0 bottom-0 z-50 flex flex-col min-h-0 bg-[#fbfbfa] border-l border-neutral-200 shadow-xl transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Painel de propriedades"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-2 top-2 z-10 p-1.5 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 min-[1280px]:hidden"
          aria-label="Fechar propriedades"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col flex-1 min-h-0 min-w-0 pt-10 min-[1280px]:pt-0">
          {children}
        </div>
      </div>
    </>
  );
};
