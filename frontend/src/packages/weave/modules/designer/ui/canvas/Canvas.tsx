import { ZoomIn, ZoomOut, RotateCcw, Magnet } from 'lucide-react';
import { memo, useMemo, useRef, useState, type RefObject } from 'react';
import { stylePreviewDebug } from '../../../../shared/diagnostics/stylePreviewDebug';
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery';
import { cn } from '../../../../shared/ui/cn';
import { getAllPlacedBandIds } from '../../../band/domain';
import { type ReportPage, getPageContentSize } from '../../../page/domain';
import { useDataSourceCatalog } from '../../../data-source/ui';
import { getReportPage } from '../../../report/domain';
import { PAGE_ZOOM_MAX, PAGE_ZOOM_MIN } from '../../../viewport/domain';
import { usePageZoom } from '../../../viewport/ui';
import { useDesignerStore, useDesignerStoreApi } from '../../application/store/DesignerStoreContext';
import { CANVAS_SCROLL_PADDING_CLASS } from '../layout/designerLayout';
import { CanvasFieldModeToggle } from '../toolbar/CanvasFieldModeToggle';
import { AlignmentGuidesOverlay } from './AlignmentGuidesOverlay';
import { PlacedBandOverlay } from './bands/PlacedBandOverlay';
import { type CanvasFieldMode, CanvasFieldModeContext } from './canvasFieldModeContext';
import {
  resolveCanvasSelectionClasses,
  type CanvasSelectionClasses,
} from './canvasSelectionClasses';
import { DesignerEmptyState } from './DesignerEmptyState';
import { DesignerSelectionContext } from './designerSelectionContext';
import { DesignerZoomContext } from './designerZoomContext';
import { handlePageContentDrop, hasDesignerDrag } from './designerDragDrop';
import { PageMarginGuides } from './PageMarginGuides';
import { TextEditHint } from './TextEditHint';
import { useCanvasHoverHitTest } from './useCanvasHoverHitTest';
import { CanvasPageTabs } from './CanvasPageTabs';

interface CanvasDesignerPageProps {
  zoom: number;
  page: ReportPage;
  placedBandIds: string[];
  contentSize: { width: number; height: number };
  pageWrapRef: RefObject<HTMLDivElement | null>;
  isPageDropTarget: boolean;
  onPageDropTargetChange: (value: boolean) => void;
  isPageSelected: boolean;
  onSelectPage: () => void;
}

const CanvasDesignerPage = memo(function CanvasDesignerPage({
  zoom,
  page,
  placedBandIds,
  contentSize,
  pageWrapRef,
  isPageDropTarget,
  onPageDropTargetChange,
  isPageSelected,
  onSelectPage,
}: CanvasDesignerPageProps) {
  const designerStore = useDesignerStoreApi();
  const addBand = useDesignerStore((state) => state.addBand);
  const addComponent = useDesignerStore((state) => state.addComponent);
  const addElement = useDesignerStore((state) => state.addElement);
  const addListWithField = useDesignerStore((state) => state.addListWithField);
  const dataSourceCatalog = useDataSourceCatalog();
  const { handlePointerMove, handlePointerLeave } =
    useCanvasHoverHitTest(zoom);

  stylePreviewDebug.countRender('CanvasDesignerPage');

  const isFixedPageHeight = (page.profile ?? 'document') !== 'continuous';

  return (
    <DesignerZoomContext.Provider value={zoom}>
      <div
        ref={pageWrapRef}
        data-designer-page
        data-tour="page"
        className={cn(
          'weave-paper bg-white shadow-sm border relative transition-[box-shadow,border-color]',
          isPageSelected
            ? 'border-sky-400 ring-2 ring-sky-400/30'
            : 'border-neutral-200'
        )}
        style={{
          width: page.width,
          height: isFixedPageHeight ? page.height : undefined,
          minHeight: page.height,
          padding: `${page.margins.top}px ${page.margins.right}px ${page.margins.bottom}px ${page.margins.left}px`,
          boxSizing: 'border-box',
        }}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest(
              '[data-band-overlay], .component-node, .band-toolbar, .band-surface, .vector-line-handle'
            )
          ) {
            return;
          }
          onSelectPage();
        }}
      >
        <PageMarginGuides page={page} active={isPageSelected} />
        <div
          data-designer-page-content
          className={cn(
            'relative transition-shadow',
            isPageDropTarget && 'ring-2 ring-indigo-400/60 ring-inset'
          )}
          style={{
            width: '100%',
            minHeight: contentSize.height,
            height: isFixedPageHeight ? contentSize.height : undefined,
          }}
          onPointerMoveCapture={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onDragEnter={(e) => {
            if (hasDesignerDrag(e)) onPageDropTargetChange(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              onPageDropTargetChange(false);
            }
          }}
          onDragOver={(e) => {
            if (!hasDesignerDrag(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            onPageDropTargetChange(false);
            handlePageContentDrop(
              e,
              {
                zoom,
                page,
                bands: designerStore.getState().report.bands,
                dataContext: { data: designerStore.getState().data, catalog: dataSourceCatalog, components: designerStore.getState().report.components },
              },
              { addBand, addComponent, addElement, addListWithField }
            );
          }}
        >
          {placedBandIds.map((bandId) => (
            <PlacedBandOverlay key={bandId} bandId={bandId} />
          ))}

          {placedBandIds.length === 0 && <DesignerEmptyState variant="canvas" />}

          <AlignmentGuidesOverlay />
        </div>
      </div>
    </DesignerZoomContext.Provider>
  );
});

interface CanvasProps {
  canvasSelectionClasses?: Partial<CanvasSelectionClasses>;
  /** Incrementa ao abrir/fechar painéis — recalcula fit-to-width (R2) */
  fitLayoutKey?: number;
}

export const Canvas = ({ canvasSelectionClasses, fitLayoutKey = 0 }: CanvasProps = {}) => {
  const designerStore = useDesignerStoreApi();
  const report = useDesignerStore((state) => state.report);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const page = getReportPage(report, activePageId)!;
  const clearSelection = useDesignerStore((state) => state.clearSelection);
  const selectPage = useDesignerStore((state) => state.selectPage);
  const setActivePage = useDesignerStore((state) => state.setActivePage);
  const duplicateReportPage = useDesignerStore((state) => state.duplicateReportPage);
  const removeReportPage = useDesignerStore((state) => state.removeReportPage);
  const renameReportPage = useDesignerStore((state) => state.renameReportPage);
  const selectedPageId = useDesignerStore((state) => state.selectedPageId);
  const snapEnabled = useDesignerStore((state) => state.snapEnabled);
  const setSnapEnabled = useDesignerStore((state) => state.setSnapEnabled);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const [isPageDropTarget, setIsPageDropTarget] = useState(false);
  const [fieldMode, setFieldMode] = useState<CanvasFieldMode>('data');
  const isNarrowViewport = useMediaQuery('(max-width: 1279px)');

  const isFixedPageHeight = (page.profile ?? 'document') !== 'continuous';

  const { scrollRef, spacerRef, contentRef, committedZoom, zoomIn, zoomOut, resetZoom } =
    usePageZoom({
      pageWidth: page.width,
      naturalHeight: isFixedPageHeight ? page.height : undefined,
      fitLayoutKey: `${fitLayoutKey}-${activePageId ?? ''}`,
    });

  const placedBandIds = useMemo(
    () => getAllPlacedBandIds(page, designerStore.getState().report.bands),
    [page.bands, page.dividers]
  );
  const contentSize = getPageContentSize(page);
  const resolvedSelectionClasses = useMemo(
    () => resolveCanvasSelectionClasses(canvasSelectionClasses),
    [canvasSelectionClasses]
  );

  stylePreviewDebug.countRender('Canvas');

  return (
    <DesignerSelectionContext.Provider value={resolvedSelectionClasses}>
      <CanvasFieldModeContext.Provider value={fieldMode}>
      <div className="isolate flex-1 flex flex-col min-h-0">
        <CanvasPageTabs
          pages={report.pages}
          activePageId={activePageId}
          onSelectPage={setActivePage}
          onDuplicatePage={duplicateReportPage}
          onRemovePage={removeReportPage}
          onRenamePage={renameReportPage}
          actions={<CanvasFieldModeToggle mode={fieldMode} onChange={setFieldMode} />}
        />

        <div className="flex-1 relative min-h-0">
        <div
          ref={scrollRef}
          className={cn(
            'absolute inset-0 overflow-auto bg-neutral-100',
            CANVAS_SCROLL_PADDING_CLASS
          )}
          onPointerDownCapture={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-designer-page]')) return;
            clearSelection();
          }}
        >
          <div ref={spacerRef} className="canvas-zoom-spacer mx-auto">
            <div ref={contentRef} className="canvas-zoom-stage">
              <CanvasDesignerPage
                zoom={committedZoom}
                page={page}
                placedBandIds={placedBandIds}
                contentSize={contentSize}
                pageWrapRef={pageWrapRef}
                isPageDropTarget={isPageDropTarget}
                onPageDropTargetChange={setIsPageDropTarget}
                isPageSelected={selectedPageId === page.id}
                onSelectPage={() => selectPage(page.id)}
              />
            </div>
          </div>
        </div>

        <TextEditHint />

        <div
          data-tour="zoom"
          className={cn(
            'absolute bottom-4 flex items-center gap-0.5 rounded-xl border border-neutral-200 bg-weave-surface/95 shadow-md backdrop-blur-sm p-1 z-10',
            isNarrowViewport ? 'left-4' : 'right-4'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={committedZoom <= PAGE_ZOOM_MIN}
            className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
            title="Diminuir zoom"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="min-w-[3rem] px-1 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md tabular-nums"
            title="Redefinir zoom (100%)"
            aria-label="Redefinir zoom"
          >
            {Math.round(committedZoom * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={committedZoom >= PAGE_ZOOM_MAX}
            className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-neutral-200 mx-0.5" />
          <button
            type="button"
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              snapEnabled
                ? 'text-sky-600 bg-sky-50 hover:bg-sky-100'
                : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'
            )}
            title={
              snapEnabled
                ? 'Snap ativo (Shift = desativar temporariamente)'
                : 'Snap desativado — clique para ativar'
            }
            aria-label={snapEnabled ? 'Desativar snap' : 'Ativar snap'}
            aria-pressed={snapEnabled}
          >
            <Magnet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
            title="Zoom 100%"
            aria-label="Zoom 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        </div>
      </div>
      </CanvasFieldModeContext.Provider>
    </DesignerSelectionContext.Provider>
  );
};
