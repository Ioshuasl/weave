import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery';
import { NARROW_VIEWPORT_MEDIA_QUERY } from '../../../shared/ui/breakpoints';
import { cn } from '../../../shared/ui/cn';
import { DESIGNER_MODAL_OVERLAY_Z } from '../../../shared/ui/zIndex';
import { usePageZoom } from '../../viewport/ui';
import { buildReportPreviewSheets } from '../domain/paginationEngine';
import {
  canUseBookView,
  canUseMultiPageView,
  getPreviewLayoutNaturalWidth,
  type PreviewViewMode,
} from '../domain/previewViewMode';
import {
  buildPrintPageCss,
  buildWeavePrintPayload,
  buildReportPrintJob,
  type WeavePrintPayload,
} from '../domain/reportPrintJob';
import { PreviewBottomToolbar } from './PreviewBottomToolbar';
import { PreviewSheetsLayout } from './PreviewSheetsLayout';
import { usePageVariablesResolver } from './PageVariablesContext';
import { useRenderingServices } from './RenderingServicesContext';
import type { ReportData } from '../../data-source/domain';
import type { ReportDefinition } from '../../report/domain';
import type { ElementImagesWaiter } from '../application';

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
    .print\\:hidden {
      display: none !important;
    }
    .preview-view-multi,
    .preview-view-book,
    .preview-book-spread,
    .preview-book-spread > div {
      display: block !important;
      width: auto !important;
    }
    .preview-zoom-spacer,
    .preview-zoom-stage {
      width: auto !important;
      height: auto !important;
      transform: none !important;
      zoom: 1 !important;
    }
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

const STYLESHEET_LOAD_TIMEOUT_MS = 5000;

/** O CSS do app (<link>) carrega de forma assíncrona no iframe: imprimir antes dele quebra o layout. */
function waitForStylesheets(frameDocument: Document): Promise<void> {
  const pending = Array.from(
    frameDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  ).filter((link) => !link.sheet);
  if (pending.length === 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let remaining = pending.length;
    const settle = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
    };
    pending.forEach((link) => {
      link.addEventListener('load', settle, { once: true });
      link.addEventListener('error', settle, { once: true });
    });
    window.setTimeout(resolve, STYLESHEET_LOAD_TIMEOUT_MS);
  });
}

async function printReportSheets(
  source: HTMLElement,
  pageCss: string,
  waitForImages: ElementImagesWaiter
) {
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

  // Cada folha numa página própria e com o seu tamanho: os seletores `:last-child` / `:nth-of-type`
  // do CSS não valem aqui, porque cada bloco fica dentro de um <div> próprio no layout do preview.
  const blocks = Array.from(frameDocument.querySelectorAll<HTMLElement>('.preview-sheet-block'));
  blocks.forEach((block, index) => {
    block.style.setProperty('page', `print-sheet-${index}`);
    block.style.setProperty('break-after', index < blocks.length - 1 ? 'page' : 'auto');
    block.style.setProperty('page-break-after', index < blocks.length - 1 ? 'always' : 'auto');
    block.style.setProperty('margin', '0');
  });

  const cleanup = () => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  };

  const triggerPrint = async () => {
    await waitForStylesheets(frameDocument);
    await waitForImages(frameDocument);
    frameWindow.focus();
    frameWindow.print();
    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 2000);
  };

  if (frameDocument.readyState === 'complete') {
    await triggerPrint();
  } else {
    await new Promise<void>((resolve) => {
      iframe.addEventListener(
        'load',
        () => {
          void triggerPrint().then(resolve);
        },
        { once: true }
      );
    });
  }
}

interface ReportPreviewProps {
  report: ReportDefinition;
  data: ReportData;
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
  reportId?: string;
  onPrint?: (payload: WeavePrintPayload) => void | Promise<void>;
  /** Notifica abertura/fechamento do modal (não chamado em `embedded`) */
  onOpenChange?: (open: boolean) => void;
}

export const ReportPreview = ({
  report,
  data,
  onClose,
  variant = 'modal',
  reportId,
  onPrint,
  onOpenChange,
}: ReportPreviewProps) => {
  const isNarrow = useMediaQuery(NARROW_VIEWPORT_MEDIA_QUERY);
  const [viewMode, setViewMode] = useState<PreviewViewMode>('single');

  useEffect(() => {
    if (variant === 'embedded' || !onOpenChange) return;
    onOpenChange(true);
    return () => onOpenChange(false);
  }, [onOpenChange, variant]);

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

  const { waitForImages } = useRenderingServices();
  const resolvePageVariables = usePageVariablesResolver();
  const printRootRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(async () => {
    if (onPrint) {
      await onPrint(
        buildWeavePrintPayload(report, data, {
          reportId,
          source: 'preview',
          resolvePageVariables,
        })
      );
      return;
    }

    const source = printRootRef.current;
    if (source) {
      await waitForImages(source);
      const pageCss = buildPrintPageCss(buildReportPrintJob(report, data, { resolvePageVariables }).sheets);
      await printReportSheets(source, pageCss, waitForImages);
      return;
    }
    window.print();
  }, [onPrint, report, data, reportId, waitForImages, resolvePageVariables]);

  const isEmbedded = variant === 'embedded';
  const isFullscreenModal = !isEmbedded && isNarrow;
  const multiDesignPages = report.pages.length > 1;
  const firstSheet = sheets[0];

  const panel = (
    <div
      className={cn(
        'report-preview-panel bg-weave-surface flex flex-col overflow-hidden',
        isEmbedded || isFullscreenModal
          ? 'h-full w-full'
          : 'rounded-xl shadow-xl border border-neutral-200/60 w-full max-w-5xl h-full'
      )}
    >
      <div className="report-preview-toolbar p-3 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 shrink-0">
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
            className="px-3 py-1.5 bg-weave-surface border border-neutral-200 text-neutral-700 text-[13px] rounded-md hover:bg-neutral-50 transition-colors shadow-sm"
          >
            Imprimir
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-indigo-600 text-white text-[13px] rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
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
            'report-preview-scroll absolute inset-0 overflow-auto bg-neutral-100',
            isFullscreenModal ? 'p-4' : 'p-8',
            isReceiptPreview && 'bg-neutral-200/60'
          )}
        >
          <div ref={spacerRef} className="preview-zoom-spacer mx-auto">
            <div
              ref={contentRef}
              className="preview-zoom-stage flex flex-col items-center"
            >
              <div ref={printRootRef} id="report-print-root" className="w-full flex flex-col items-center">
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

  const overlay = (
    <div
      data-weave-overlay={isEmbedded ? undefined : ''}
      data-weave-theme={isEmbedded ? undefined : ''}
      className={cn(
        'report-preview-overlay',
        isEmbedded
          ? 'h-full w-full flex flex-col'
          : isFullscreenModal
            ? 'fixed inset-0 bg-weave-surface flex flex-col'
            : 'fixed inset-0 bg-neutral-900/20 flex items-center justify-center p-8 backdrop-blur-sm'
      )}
      style={isEmbedded ? undefined : { zIndex: DESIGNER_MODAL_OVERLAY_Z }}
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

  if (isEmbedded) return overlay;
  return createPortal(overlay, document.body);
};
