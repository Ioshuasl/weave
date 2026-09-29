export type { PageLayoutProfile, PageMargins, PageSizeUnit, ReportPage } from './page';
export { clampRectToPage, getPageContentSize } from './pageGeometry';
export {
  BUILTIN_PAGE_PRESETS,
  BUILTIN_PAGE_PRESET_CATALOG,
  CUSTOM_PAGE_PRESET_ID,
  DEFAULT_PAGE_PRESET_ID,
  DEFAULT_PAGE_SIZE_UNIT,
  DESIGNER_DPI,
  PAGE_PRESET_BY_ID,
  buildPagePresetCatalog,
  cmToPx,
  formatPrintPageSize,
  getOrientationPairPresetId,
  getPagePreset,
  marginsCmToPx,
  presetDimensionsToPx,
  pxToCm,
} from './pagePresets';
export type { PagePresetCatalog, PagePresetDefinition, PagePresetGroup } from './pagePresets';
