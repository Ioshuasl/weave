export {
  Weave,
  type WeaveMode,
  type WeaveProps,
  type WeaveSavePayload,
  type WeaveHistoryPersistPayload,
} from './Weave';

export type {
  AssistantAction,
  AssistantRequest,
  AssistantResponse,
  AssistantSender,
  AssistantImage,
  AssistantUsage,
} from './modules/assistant/domain';
export { ASSISTANT_IMAGE_LIMITS, ASSISTANT_IMAGE_PRIVACY_HINT, validateAssistantImageFile } from './modules/assistant/domain';
/** Catálogo único do que a IA pode alterar — o backend do host usa o mesmo para montar o prompt e validar a resposta. */
export {
  ELEMENT_PROPERTIES,
  LINES_PRESET_VALUES,
  STYLE_PROPERTIES,
  applyAssistantActions,
  describeAssistantCatalog,
  normalizePropertyValue,
} from './modules/assistant/domain';
export type { ReportDefinition } from './modules/report/domain';
export { createEmptyReport } from './modules/report/domain';
export type { ReportData } from './modules/data-source/domain';
export type { ReportPage, PageMargins, PageLayoutProfile, PageSizeUnit } from './modules/page/domain';
export type { ReportBand, BandType } from './modules/band/domain';
export type { ReportComponent, ComponentType } from './modules/components/common/domain';

export type { HistoryEntry } from './modules/history/domain';

export type { DesignerPanelLayoutPreset } from './modules/designer/ui';
export { DEFAULT_CANVAS_SELECTION_CLASSES, type CanvasSelectionClasses } from './modules/designer/ui';
export {
  REPORT_AUTO_SAVE_INTERVAL_MS,
  REPORT_HISTORY_PERSIST_INTERVAL_MS,
  type ReportAutoSaveIntervalMs,
  type ReportHistoryPersistIntervalMs,
} from './modules/designer/application';

export {
  buildPrintPageCss,
  buildWeavePrintPayload,
  buildReportPrintJob,
  REPORT_PRINT_JOB_VERSION,
  type WeavePrintPayload,
  type ReportPrintJob,
  type ReportPrintSheet,
  type ReportPrintSheetSize,
} from './modules/rendering/domain';

export type { DataSourceCatalog, DataSourceDefinition, DataSourceKind } from './modules/data-source/domain';

export type { ReportImageResolver } from './modules/components/image/application';

export type { PageVariablesResolver } from './modules/expression/domain';

export {
  buildSystemVariables,
  DESIGN_MODE_SYSTEM_VARIABLES,
  SYSTEM_VARIABLE_FIELD_OPTIONS,
  type SystemVariables,
} from './modules/expression/domain';

export {
  BUILTIN_PAGE_PRESETS,
  PAGE_PRESET_BY_ID,
  buildPagePresetCatalog,
  formatPrintPageSize,
  marginsCmToPx,
  presetDimensionsToPx,
  type PagePresetCatalog,
  type PagePresetDefinition,
} from './modules/page/domain';
