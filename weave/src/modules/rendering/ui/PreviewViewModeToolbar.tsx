import React from 'react';
import { BookOpen, FileText, LayoutGrid } from 'lucide-react';
import { cn } from '../../../shared/ui/cn';
import {
  PREVIEW_VIEW_MODES,
  type PreviewViewMode,
} from '../domain/previewViewMode';

const VIEW_MODE_ICONS: Record<PreviewViewMode, React.ReactNode> = {
  single: <FileText className="w-4 h-4" />,
  multi: <LayoutGrid className="w-4 h-4" />,
  book: <BookOpen className="w-4 h-4" />,
};

interface PreviewViewModeToolbarProps {
  mode: PreviewViewMode;
  onChange: (mode: PreviewViewMode) => void;
  multiPageEnabled?: boolean;
  bookEnabled?: boolean;
  className?: string;
}

export function PreviewViewModeToolbar({
  mode,
  onChange,
  multiPageEnabled = true,
  bookEnabled = true,
  className,
}: PreviewViewModeToolbarProps) {
  const isModeDisabled = (id: PreviewViewMode) => {
    if (id === 'single') return false;
    if (id === 'multi') return !multiPageEnabled;
    return !bookEnabled;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white/95 shadow-sm backdrop-blur-sm p-0.5 print:hidden pointer-events-auto',
        className
      )}
      role="toolbar"
      aria-label="Modelo de visualização"
      onClick={(e) => e.stopPropagation()}
    >
      {PREVIEW_VIEW_MODES.map((item) => {
        const disabled = isModeDisabled(item.id);
        const active = mode === item.id;

        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.id)}
            title={disabled ? `${item.label} (indisponível)` : item.title}
            aria-label={item.label}
            aria-pressed={active}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              active
                ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                : 'text-neutral-600 hover:bg-neutral-100',
              disabled && 'opacity-40 pointer-events-none'
            )}
          >
            {VIEW_MODE_ICONS[item.id]}
          </button>
        );
      })}
    </div>
  );
}
