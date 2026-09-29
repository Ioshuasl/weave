import React from 'react';
import { cn } from '../../../shared/ui/cn';
import { PageZoomToolbar } from '../../viewport/ui';
import { PreviewViewModeToolbar } from './PreviewViewModeToolbar';
import type { PreviewViewMode } from '../domain/previewViewMode';

interface PreviewBottomToolbarProps {
  viewMode: PreviewViewMode;
  onViewModeChange: (mode: PreviewViewMode) => void;
  multiPageEnabled: boolean;
  bookEnabled: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  align?: 'left' | 'right';
  className?: string;
}

export function PreviewBottomToolbar({
  viewMode,
  onViewModeChange,
  multiPageEnabled,
  bookEnabled,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  align = 'right',
  className,
}: PreviewBottomToolbarProps) {
  return (
    <div
      className={cn(
        'absolute bottom-4 flex items-center gap-2 z-20 pointer-events-none print:hidden',
        align === 'left' ? 'left-4' : 'right-4',
        className
      )}
    >
      <PreviewViewModeToolbar
        mode={viewMode}
        onChange={onViewModeChange}
        multiPageEnabled={multiPageEnabled}
        bookEnabled={bookEnabled}
      />
      <PageZoomToolbar
        zoom={zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onResetZoom}
        floating={false}
      />
    </div>
  );
}
