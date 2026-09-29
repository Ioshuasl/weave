import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '../../../shared/ui/cn';
import { PAGE_ZOOM_MAX, PAGE_ZOOM_MIN } from '../domain/pageZoom';

interface PageZoomToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  className?: string;
  align?: 'left' | 'right';
  /** false quando embutido em PreviewBottomToolbar */
  floating?: boolean;
}

export function PageZoomToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  className,
  align = 'right',
  floating = true,
}: PageZoomToolbarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white/95 shadow-sm backdrop-blur-sm p-0.5 print:hidden pointer-events-auto',
        floating && 'absolute bottom-4 z-20',
        floating && (align === 'left' ? 'left-4' : 'right-4'),
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoom <= PAGE_ZOOM_MIN}
        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
        title="Diminuir zoom"
        aria-label="Diminuir zoom"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="min-w-[3rem] px-1 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md tabular-nums"
        title="Redefinir zoom (100%)"
        aria-label="Redefinir zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoom >= PAGE_ZOOM_MAX}
        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
        title="Aumentar zoom"
        aria-label="Aumentar zoom"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-neutral-200 mx-0.5" />
      <button
        type="button"
        onClick={onReset}
        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
        title="Zoom 100%"
        aria-label="Zoom 100%"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
