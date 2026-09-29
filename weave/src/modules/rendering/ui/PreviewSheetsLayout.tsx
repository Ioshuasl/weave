import React from 'react';
import type { ReportPreviewSheet } from '../domain/paginationEngine';
import type { ReportDefinition } from '../../report/domain';
import type { ReportPage } from '../../page/domain';
import type { PreviewViewMode } from '../domain/previewViewMode';
import {
  groupSheetsIntoBookSpreads,
  PREVIEW_BOOK_SPREAD_GAP_PX,
  PREVIEW_MULTI_GRID_GAP_PX,
} from '../domain/previewViewMode';
import { cn } from '../../../shared/ui/cn';
import { ReportPageSheet } from './ReportPageSheet';
import { buildSystemVariables } from '../../expression/domain';

interface PreviewSheetBlockProps {
  sheet: ReportPreviewSheet;
  page: ReportPage;
  report: ReportDefinition;
  data: Record<string, unknown[]>;
  multiDesignPages: boolean;
  compactLabel?: boolean;
}

function PreviewSheetBlock({
  sheet,
  page,
  report,
  data,
  multiDesignPages,
  compactLabel,
}: PreviewSheetBlockProps) {
  const showPageLabel = sheet.globalTotalPages > 1;
  const sysContext = buildSystemVariables({
    globalPageNumber: sheet.globalPageNumber,
    globalTotalPages: sheet.globalTotalPages,
    outputPageNumber: sheet.outputPageNumber,
    outputTotalPages: sheet.outputTotalPages,
    reportName: report.name,
  });

  return (
    <div
      className={cn(
        'preview-sheet-block shrink-0',
        showPageLabel && 'mb-6 print:mb-0'
      )}
      style={{ width: sheet.pageWidth }}
    >
      {showPageLabel && (
        <p
          className={cn(
            'text-neutral-500 text-center print:hidden',
            compactLabel ? 'text-[10px] mb-1' : 'text-[11px] mb-2'
          )}
        >
          {multiDesignPages ? `${sheet.designPageName} · ` : ''}
          Folha {sheet.globalPageNumber} de {sheet.globalTotalPages}
        </p>
      )}
      <ReportPageSheet
        page={page}
        bands={report.bands}
        components={report.components}
        data={data}
        contentWidth={sheet.contentWidth}
        contentHeight={sheet.contentHeight}
        layers={sheet.layers}
        sysContext={sysContext}
        className="border border-neutral-200 print:border-0 print:shadow-none shadow-sm"
      />
    </div>
  );
}

interface PreviewSheetsLayoutProps {
  sheets: ReportPreviewSheet[];
  report: ReportDefinition;
  data: Record<string, unknown[]>;
  viewMode: PreviewViewMode;
  multiColumnCount: number;
  multiDesignPages: boolean;
}

export function PreviewSheetsLayout({
  sheets,
  report,
  data,
  viewMode,
  multiColumnCount,
  multiDesignPages,
}: PreviewSheetsLayoutProps) {
  const resolvePage = (sheet: ReportPreviewSheet) =>
    report.pages.find((p) => p.id === sheet.designPageId) ?? report.pages[0];

  if (viewMode === 'book') {
    const spreads = groupSheetsIntoBookSpreads(sheets);

    return (
      <div className="preview-view-book flex flex-col items-center gap-8 w-full">
        {spreads.map((spread, index) => {
          const slotWidth = Math.max(
            spread.left?.pageWidth ?? 0,
            spread.right?.pageWidth ?? 0
          );

          return (
            <div
              key={`spread-${index}`}
              className="preview-book-spread flex items-start justify-center"
              style={{ gap: PREVIEW_BOOK_SPREAD_GAP_PX }}
            >
              <div
                className="flex justify-end shrink-0"
                style={{ width: slotWidth }}
              >
                {spread.left && (
                  <PreviewSheetBlock
                    sheet={spread.left}
                    page={resolvePage(spread.left)}
                    report={report}
                    data={data}
                    multiDesignPages={multiDesignPages}
                    compactLabel
                  />
                )}
              </div>
              <div
                className="flex justify-start shrink-0"
                style={{ width: slotWidth }}
              >
                {spread.right && (
                  <PreviewSheetBlock
                    sheet={spread.right}
                    page={resolvePage(spread.right)}
                    report={report}
                    data={data}
                    multiDesignPages={multiDesignPages}
                    compactLabel
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (viewMode === 'multi') {
    return (
      <div
        className="preview-view-multi w-full mx-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${multiColumnCount}, minmax(0, max-content))`,
          gap: PREVIEW_MULTI_GRID_GAP_PX,
          justifyContent: 'center',
        }}
      >
        {sheets.map((sheet) => {
          const key = `${sheet.designPageId}-${sheet.outputPageNumber}-${sheet.globalPageNumber}`;
          return (
            <div key={key}>
              <PreviewSheetBlock
                sheet={sheet}
                page={resolvePage(sheet)}
                report={report}
                data={data}
                multiDesignPages={multiDesignPages}
                compactLabel
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="preview-view-single flex flex-col items-center w-full">
      {sheets.map((sheet) => {
        const key = `${sheet.designPageId}-${sheet.outputPageNumber}-${sheet.globalPageNumber}`;
        return (
          <div key={key}>
            <PreviewSheetBlock
              sheet={sheet}
              page={resolvePage(sheet)}
              report={report}
              data={data}
              multiDesignPages={multiDesignPages}
            />
          </div>
        );
      })}
    </div>
  );
}
