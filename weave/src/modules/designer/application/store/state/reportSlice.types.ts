import { ReportDefinition } from '../../../../report/domain';
import { type PagePresetCatalog, type PagePresetDefinition } from '../../../../page/domain';

export interface ReportSlice {
  report: ReportDefinition;
  /** Página de design em edição no canvas (Fase 3.1) */
  activePageId: string | null;
  data: any; // The JSON data for preview
  /** Catálogo de presets (built-in + extensões do host — Fase 3.5) */
  pagePresetCatalog: PagePresetCatalog;

  setHostPagePresets: (presets?: PagePresetDefinition[]) => void;
  setReportData: (data: any) => void;
  loadReport: (report: ReportDefinition, options?: { data?: any; replaceData?: boolean }) => void;
}
