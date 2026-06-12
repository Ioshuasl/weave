import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDesignerStore } from '../../store/designerStore';
import { cn } from '../../utils/cn';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { usePageZoom } from '../../hooks/usePageZoom';
import { NARROW_VIEWPORT_MEDIA_QUERY } from '../designer/designerLayout';
import { PreviewBottomToolbar } from './PreviewBottomToolbar';
import { PreviewSheetsLayout } from './PreviewSheetsLayout';
import { buildReportPreviewSheets } from '../../utils/paginationEngine';
import {
  buildPrintPageCss,
  buildReportDesignerPrintPayload,
  buildReportPrintJob,
  type ReportDesignerPrintPayload,
} from '../../utils/reportPrintJob';
import {
  canUseBookView,
  canUseMultiPageView,
  getPreviewLayoutNaturalWidth,
  type PreviewViewMode,
} from '../../utils/previewViewMode';
const PRINT_FRAME_BASE = `
  html, body, #report-print-root {
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .preview-sheet-block {
    break-after: page;
    page-break-after: always;
  }
  .preview-sheet-block:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  @media print {
    body,
    #report-print-root,
    #report-print-root * {
      visibility: visible !important;
    }
  }
`;

function collectDocumentStyles(pageCss: string): string {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('');
  const inline = Array.from(document.querySelectorAll('style'))
    .filter((node) => !node.textContent?.includes('report-preview-overlay'))
    .map((node) => node.outerHTML)
    .join('');
  return `${links}${inline}<style>${pageCss}\n${PRINT_FRAME_BASE}</style>`;
}

function printReportSheets(source: HTMLElement, pageCss: string) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  );
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    document.body.removeChild(iframe);
    return;
  }

  frameDocument.open();
  frameDocument.write(
    `<!DOCTYPE html><html><head><meta charset="UTF-8">${collectDocumentStyles(pageCss)}</head><body><div id="report-print-root">${source.innerHTML}</div></body></html>`
  );
  frameDocument.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  };

  const triggerPrint = () => {
    frameWindow.focus();
    frameWindow.print();
    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 2000);
  };

  if (frameDocument.readyState === 'complete') {
    window.setTimeout(triggerPrint, 150);
  } else {
    iframe.addEventListener('load', () => window.setTimeout(triggerPrint, 150), {
      once: true,
    });
  }
}

interface ReportPreviewProps {
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
  reportId?: string;
  onPrint?: (payload: ReportDesignerPrintPayload) => void | Promise<void>;
}

export const ReportPreview = ({
  onClose,
  variant = 'modal',
  reportId,
  onPrint,
}: ReportPreviewProps) => {
  const isNarrow = useMediaQuery(NARROW_VIEWPORT_MEDIA_QUERY);
  const report = useDesignerStore((state) => state.report);
  const data = useDesignerStore((state) => state.data);
  const [viewMode, setViewMode] = useState<PreviewViewMode>('single');

  const sheets = useMemo(
    () => buildReportPreviewSheets(report, data),
    [report, data]
  );

  const referencePageWidth = useMemo(
    () => sheets.reduce((max, sheet) => Math.max(max, sheet.pageWidth), 0),
    [sheets]
  );

  const isReceiptPreview = report.pages.some((p) => p.profile === 'continuous');
  const multiPageEnabled = canUseMultiPageView(sheets.length, isReceiptPreview);
  const bookEnabled = canUseBookView(sheets.length, isReceiptPreview);
  const multiColumnCount = isNarrow ? 1 : 2;

  const layoutNaturalWidth = useMemo(
    () =>
      getPreviewLayoutNaturalWidth(viewMode, referencePageWidth, multiColumnCount),
    [viewMode, referencePageWidth, multiColumnCount]
  );

  const viewLayoutKey = `${sheets.length}-${viewMode}-${multiColumnCount}`;

  const { scrollRef, spacerRef, contentRef, committedZoom, zoomIn, zoomOut, resetZoom } =
    usePageZoom({
      pageWidth: layoutNaturalWidth,
      fitLayoutKey: viewLayoutKey,
    });

  useEffect(() => {
    if (viewMode === 'multi' && !multiPageEnabled) {
      setViewMode('single');
    }
    if (viewMode === 'book' && !bookEnabled) {
      setViewMode('single');
    }
  }, [viewMode, multiPageEnabled, bookEnabled]);

  const handlePrint = useCallback(async () => {
    if (onPrint) {
      await onPrint(
        buildReportDesignerPrintPayload(report, data, {
          reportId,
          source: 'preview',
        })
      );
      return;
    }

    const source = document.getElementById('report-print-root');
    if (source) {
      const pageCss = buildPrintPageCss(buildReportPrintJob(report, data).sheets);
      printReportSheets(source, pageCss);
      return;
    }
    window.print();
  }, [onPrint, report, data, reportId]);

  const isEmbedded = variant === 'embedded';
  const isFullscreenModal = !isEmbedded && isNarrow;
  const multiDesignPages = report.pages.length > 1;
  const firstSheet = sheets[0];

  const panel = (
    <div
      className={cn(
        'report-preview-panel bg-white flex flex-col overflow-hidden',
        isEmbedded || isFullscreenModal
          ? 'h-full w-full'
          : 'rounded-xl shadow-xl border border-neutral-200/60 w-full max-w-5xl h-full'
      )}
    >
      <div className="report-preview-toolbar p-3 border-b border-neutral-100 flex justify-between items-center bg-[#fbfbfa] shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-neutral-800">Pré-visualização</h2>
          {firstSheet && (
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {multiDesignPages ? `${report.pages.length} páginas de design · ` : ''}
              {sheets.length} folha{sheets.length === 1 ? '' : 's'} de saída ·{' '}
              {firstSheet.pageWidth}×{firstSheet.pageHeight}px
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 text-[13px] rounded-md hover:bg-neutral-50 transition-colors shadow-sm"
          >
            Imprimir
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-900 text-white text-[13px] rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
            >
              {isEmbedded ? 'Voltar' : 'Fechar'}
            </button>
          )}
        </div>
      </div>

      <div className="report-preview-viewport relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          className={cn(
            'report-preview-scroll absolute inset-0 overflow-auto bg-[#efefef]/50',
            isFullscreenModal ? 'p-4' : 'p-8',
            isReceiptPreview && 'bg-neutral-200/60'
          )}
          style={{
            backgroundImage: 'radial-gradient(#d4d4d4 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div ref={spacerRef} className="preview-zoom-spacer mx-auto">
            <div
              ref={contentRef}
              className="preview-zoom-stage flex flex-col items-center"
            >
              <div id="report-print-root" className="w-full flex flex-col items-center">
                <PreviewSheetsLayout
                  sheets={sheets}
                  report={report}
                  data={data}
                  viewMode={viewMode}
                  multiColumnCount={multiColumnCount}
                  multiDesignPages={multiDesignPages}
                />
              </div>
            </div>
          </div>
        </div>

        <PreviewBottomToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          multiPageEnabled={multiPageEnabled}
          bookEnabled={bookEnabled}
          zoom={committedZoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          align={isNarrow ? 'left' : 'right'}
        />
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'report-preview-overlay',
        isEmbedded
          ? 'h-full w-full flex flex-col'
          : isFullscreenModal
            ? 'fixed inset-0 z-50 bg-white flex flex-col'
            : 'fixed inset-0 z-50 bg-neutral-900/20 flex items-center justify-center p-8 backdrop-blur-sm'
      )}
    >
      {panel}

      <style>{`
        @media print {
          html,
          body,
          #root,
          .report-preview-overlay,
          .report-preview-panel,
          .report-preview-scroll {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            position: static !important;
            inset: auto !important;
            display: block !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
          }

          .report-preview-toolbar {
            display: none !important;
          }

          body * {
            visibility: hidden;
          }

          #report-print-root,
          #report-print-root * {
            visibility: visible;
          }

          #report-print-root {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }

          .preview-view-multi,
          .preview-view-book,
          .preview-book-spread {
            display: block !important;
          }

          .preview-sheet-block {
            break-after: page;
            page-break-after: always;
          }

          .preview-sheet-block:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .preview-zoom-spacer,
          .preview-zoom-stage {
            width: auto !important;
            height: auto !important;
            transform: none !important;
            zoom: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};
