import type {
  PageLayoutProfile,
  PageMargins,
  ReportData,
  ReportDefinition,
} from '../types/report';
import type { OutputPageContext } from './bandScopeUtils';
import { buildSystemVariables, type SystemVariables } from './systemVariables';
import { DESIGNER_DPI, formatPrintPageSize, pxToCm } from './pagePresets';
import { buildReportPreviewSheets } from './paginationEngine';
import type { PreviewLayer } from './previewLayout';

export const REPORT_PRINT_JOB_VERSION = 1 as const;

export interface ReportPrintSheetSize {
  widthPx: number;
  heightPx: number;
  widthCm: number;
  heightCm: number;
}

export interface ReportPrintSheet {
  designPageId: string;
  designPageName: string;
  outputPageNumber: number;
  outputTotalPages: number;
  globalPageNumber: number;
  globalTotalPages: number;
  profile: PageLayoutProfile;
  presetId?: string;
  size: ReportPrintSheetSize;
  margins: PageMargins;
  contentWidth: number;
  contentHeight: number;
  outputContext: OutputPageContext;
  systemVariables: SystemVariables;
  layers: PreviewLayer[];
}

export interface ReportPrintJob {
  version: typeof REPORT_PRINT_JOB_VERSION;
  dpi: number;
  generatedAt: string;
  sheets: ReportPrintSheet[];
}

/** Payload entregue ao host em `onPrint` (botão Imprimir no preview) */
export interface ReportDesignerPrintPayload {
  reportId?: string;
  report: ReportDefinition;
  data: Record<string, unknown[]>;
  printJob: ReportPrintJob;
  source?: 'preview';
}

export function buildReportPrintJob(
  report: ReportDefinition,
  data: ReportData,
  options?: { reportName?: string; generatedAt?: Date }
): ReportPrintJob {
  const previewSheets = buildReportPreviewSheets(report, data);
  const pageById = Object.fromEntries(report.pages.map((page) => [page.id, page]));

  const sheets: ReportPrintSheet[] = previewSheets.map((sheet) => {
    const page = pageById[sheet.designPageId] ?? report.pages[0];

    return {
      designPageId: sheet.designPageId,
      designPageName: sheet.designPageName,
      outputPageNumber: sheet.outputPageNumber,
      outputTotalPages: sheet.outputTotalPages,
      globalPageNumber: sheet.globalPageNumber,
      globalTotalPages: sheet.globalTotalPages,
      profile: page.profile ?? 'document',
      presetId: page.presetId,
      size: {
        widthPx: sheet.pageWidth,
        heightPx: sheet.pageHeight,
        widthCm: pxToCm(sheet.pageWidth),
        heightCm: pxToCm(sheet.pageHeight),
      },
      margins: { ...page.margins },
      contentWidth: sheet.contentWidth,
      contentHeight: sheet.contentHeight,
      outputContext: sheet.context,
      systemVariables: buildSystemVariables({
        globalPageNumber: sheet.globalPageNumber,
        globalTotalPages: sheet.globalTotalPages,
        outputPageNumber: sheet.outputPageNumber,
        outputTotalPages: sheet.outputTotalPages,
        reportName: options?.reportName ?? report.name,
        generatedAt: options?.generatedAt,
      }),
      layers: sheet.layers,
    };
  });

  return {
    version: REPORT_PRINT_JOB_VERSION,
    dpi: DESIGNER_DPI,
    generatedAt: new Date().toISOString(),
    sheets,
  };
}

/** Gera regras `@page` para impressão conforme tamanho/perfil de cada folha */
export function buildPrintPageCss(sheets: ReportPrintSheet[]): string {
  if (sheets.length === 0) {
    return '@page { size: A4; margin: 0; }';
  }

  if (sheets.length === 1) {
    const sheet = sheets[0];
    const size = formatPrintPageSize(
      sheet.size.widthCm,
      sheet.size.heightCm,
      sheet.profile
    );
    return `@page { size: ${size}; margin: 0; }`;
  }

  const pageRules = sheets
    .map((sheet, index) => {
      const size = formatPrintPageSize(
        sheet.size.widthCm,
        sheet.size.heightCm,
        sheet.profile
      );
      return `@page print-sheet-${index} { size: ${size}; margin: 0; }`;
    })
    .join('\n');

  const assignRules = sheets
    .map(
      (_, index) =>
        `.preview-sheet-block:nth-of-type(${index + 1}) { page: print-sheet-${index}; }`
    )
    .join('\n');

  return `${pageRules}\n${assignRules}`;
}

export function buildReportDesignerPrintPayload(
  report: ReportDefinition,
  data: Record<string, unknown[]>,
  options?: { reportId?: string; source?: 'preview' }
): ReportDesignerPrintPayload {
  return {
    reportId: options?.reportId,
    report,
    data,
    printJob: buildReportPrintJob(report, data, { reportName: report.name }),
    source: options?.source ?? 'preview',
  };
}
