import { type PagePresetCatalog, type PagePresetDefinition } from '../../../../page/domain';
import type { ReportCalculo } from '../../../../expression/domain/calculos';
import type { AssistantAction, AssistantApplyResult } from '../../../../assistant/domain';
import type { BandLinesPreset } from '../../../../band/domain';
import { ReportDefinition } from '../../../../report/domain';

export interface ReportSlice {
  report: ReportDefinition;
  /** Página de design em edição no canvas (Fase 3.1) */
  activePageId: string | null;
  data: any; // The JSON data for preview
  /** Catálogo de presets (built-in + extensões do host — Fase 3.5) */
  pagePresetCatalog: PagePresetCatalog;

  setHostPagePresets: (presets?: PagePresetDefinition[]) => void;
  setReportData: (data: any) => void;
  setCalculos: (calculos: ReportCalculo[]) => void;
  renameCalculo: (id: string, nome: string) => void;
  /** Aplica as ações do assistente de IA como UM passo de histórico (um Ctrl+Z desfaz tudo) */
  applyAssistantActions: (actions: AssistantAction[]) => AssistantApplyResult;
  /** Estilo de linhas da folha em um clique (nenhuma, simples ou grade de cartório) */
  applyBandLinesPreset: (preset: BandLinesPreset) => void;
  loadReport: (report: ReportDefinition, options?: { data?: any; replaceData?: boolean }) => void;
}
