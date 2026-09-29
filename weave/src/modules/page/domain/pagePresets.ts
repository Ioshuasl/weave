import type { PageLayoutProfile, PageMargins, PageSizeUnit } from './page';

export const DESIGNER_DPI = 96;

export type PagePresetGroup = 'document' | 'label' | 'receipt' | 'host';

export interface PagePresetDefinition {
  id: string;
  label: string;
  group: PagePresetGroup;
  profile: PageLayoutProfile;
  widthCm: number;
  heightCm: number;
  defaultMarginsCm: PageMargins;
  /** Par retrato↔paisagem para botão de orientação */
  orientationPairId?: string;
}

export const CUSTOM_PAGE_PRESET_ID = 'custom';

const MARGIN_NORMAL_CM = { top: 2.1, right: 2.1, bottom: 2.1, left: 2.1 };
const MARGIN_NARROW_CM = { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 };

export const BUILTIN_PAGE_PRESETS: PagePresetDefinition[] = [
  {
    id: 'a4-portrait',
    label: 'A4 retrato',
    group: 'document',
    profile: 'document',
    widthCm: 21,
    heightCm: 29.7,
    defaultMarginsCm: MARGIN_NORMAL_CM,
    orientationPairId: 'a4-landscape',
  },
  {
    id: 'a4-landscape',
    label: 'A4 paisagem',
    group: 'document',
    profile: 'document',
    widthCm: 29.7,
    heightCm: 21,
    defaultMarginsCm: MARGIN_NORMAL_CM,
    orientationPairId: 'a4-portrait',
  },
  {
    id: 'a3-portrait',
    label: 'A3 retrato',
    group: 'document',
    profile: 'document',
    widthCm: 29.7,
    heightCm: 42,
    defaultMarginsCm: MARGIN_NORMAL_CM,
    orientationPairId: 'a3-landscape',
  },
  {
    id: 'a3-landscape',
    label: 'A3 paisagem',
    group: 'document',
    profile: 'document',
    widthCm: 42,
    heightCm: 29.7,
    defaultMarginsCm: MARGIN_NORMAL_CM,
    orientationPairId: 'a3-portrait',
  },
  {
    id: 'a5-portrait',
    label: 'A5 retrato',
    group: 'document',
    profile: 'document',
    widthCm: 14.8,
    heightCm: 21,
    defaultMarginsCm: MARGIN_NORMAL_CM,
    orientationPairId: 'a5-landscape',
  },
  {
    id: 'a5-landscape',
    label: 'A5 paisagem',
    group: 'document',
    profile: 'document',
    widthCm: 21,
    heightCm: 14.8,
    defaultMarginsCm: MARGIN_NORMAL_CM,
    orientationPairId: 'a5-portrait',
  },
  {
    id: 'letter-portrait',
    label: 'Carta (US) retrato',
    group: 'document',
    profile: 'document',
    widthCm: 21.59,
    heightCm: 27.94,
    defaultMarginsCm: MARGIN_NORMAL_CM,
    orientationPairId: 'letter-landscape',
  },
  {
    id: 'letter-landscape',
    label: 'Carta (US) paisagem',
    group: 'document',
    profile: 'document',
    widthCm: 27.94,
    heightCm: 21.59,
    defaultMarginsCm: MARGIN_NORMAL_CM,
    orientationPairId: 'letter-portrait',
  },
  {
    id: 'label-sheet',
    label: 'Folha de etiquetas (A4)',
    group: 'label',
    profile: 'label-sheet',
    widthCm: 21,
    heightCm: 29.7,
    defaultMarginsCm: MARGIN_NORMAL_CM,
  },
  {
    id: 'label-single',
    label: 'Etiqueta avulsa',
    group: 'label',
    profile: 'label',
    widthCm: 5,
    heightCm: 3,
    defaultMarginsCm: MARGIN_NARROW_CM,
  },
  {
    id: 'receipt-80',
    label: 'Cupom 80 mm',
    group: 'receipt',
    profile: 'continuous',
    widthCm: 8,
    heightCm: 20,
    defaultMarginsCm: MARGIN_NARROW_CM,
  },
  {
    id: 'receipt-58',
    label: 'Cupom 58 mm',
    group: 'receipt',
    profile: 'continuous',
    widthCm: 5.8,
    heightCm: 15,
    defaultMarginsCm: MARGIN_NARROW_CM,
  },
];

export const PAGE_PRESET_BY_ID = Object.fromEntries(
  BUILTIN_PAGE_PRESETS.map((preset) => [preset.id, preset])
) as Record<string, PagePresetDefinition>;

export const PAGE_PRESET_GROUPS: { id: PagePresetGroup; label: string }[] = [
  { id: 'document', label: 'Documento' },
  { id: 'label', label: 'Etiqueta' },
  { id: 'receipt', label: 'Cupom' },
  { id: 'host', label: 'Personalizado (host)' },
];

export interface PagePresetCatalog {
  presets: PagePresetDefinition[];
  byId: Record<string, PagePresetDefinition>;
  groups: { id: PagePresetGroup; label: string }[];
}

export const BUILTIN_PAGE_PRESET_CATALOG: PagePresetCatalog = {
  presets: BUILTIN_PAGE_PRESETS,
  byId: PAGE_PRESET_BY_ID,
  groups: PAGE_PRESET_GROUPS.filter((group) => group.id !== 'host'),
};

/**
 * Mescla presets built-in com extensões do host (Fase 3.5).
 * IDs repetidos no host substituem o built-in correspondente.
 */
export function buildPagePresetCatalog(
  hostPresets?: PagePresetDefinition[]
): PagePresetCatalog {
  if (!hostPresets?.length) {
    return BUILTIN_PAGE_PRESET_CATALOG;
  }

  const hostById = Object.fromEntries(hostPresets.map((preset) => [preset.id, preset]));
  const mergedPresets = [
    ...BUILTIN_PAGE_PRESETS.filter((preset) => !(preset.id in hostById)),
    ...hostPresets.map((preset) => ({
      ...preset,
      group: preset.group ?? 'host',
    })),
  ];

  return {
    presets: mergedPresets,
    byId: Object.fromEntries(mergedPresets.map((preset) => [preset.id, preset])),
    groups: PAGE_PRESET_GROUPS,
  };
}

export function getPagePresetFromCatalog(
  catalog: PagePresetCatalog,
  presetId: string | undefined
): PagePresetDefinition | null {
  if (!presetId || presetId === CUSTOM_PAGE_PRESET_ID) return null;
  return catalog.byId[presetId] ?? null;
}

export const DEFAULT_PAGE_PRESET_ID = 'a4-portrait';
export const DEFAULT_PAGE_SIZE_UNIT: PageSizeUnit = 'cm';

export function cmToPx(cm: number): number {
  return Math.round((cm * DESIGNER_DPI) / 2.54);
}

export function pxToCm(px: number): number {
  return Math.round((px * 2.54) / DESIGNER_DPI * 100) / 100;
}

export function marginsCmToPx(margins: PageMargins): PageMargins {
  return {
    top: cmToPx(margins.top),
    right: cmToPx(margins.right),
    bottom: cmToPx(margins.bottom),
    left: cmToPx(margins.left),
  };
}

export function marginsPxToCm(margins: PageMargins): PageMargins {
  return {
    top: pxToCm(margins.top),
    right: pxToCm(margins.right),
    bottom: pxToCm(margins.bottom),
    left: pxToCm(margins.left),
  };
}

export function presetDimensionsToPx(preset: PagePresetDefinition): {
  width: number;
  height: number;
  margins: PageMargins;
} {
  return {
    width: cmToPx(preset.widthCm),
    height: cmToPx(preset.heightCm),
    margins: marginsCmToPx(preset.defaultMarginsCm),
  };
}

export function getPagePreset(
  presetId: string | undefined,
  catalog: PagePresetCatalog = BUILTIN_PAGE_PRESET_CATALOG
): PagePresetDefinition | null {
  return getPagePresetFromCatalog(catalog, presetId);
}

export function getOrientationPairPresetId(
  presetId: string | undefined,
  catalog: PagePresetCatalog = BUILTIN_PAGE_PRESET_CATALOG
): string | null {
  const preset = getPagePreset(presetId, catalog);
  return preset?.orientationPairId ?? null;
}

/** Regra CSS `@page` para impressão conforme perfil/tamanho da folha */
export function formatPrintPageSize(
  widthCm: number,
  heightCm: number,
  profile: PageLayoutProfile = 'document'
): string {
  if (profile === 'continuous') {
    return `${widthCm}cm auto`;
  }
  return `${widthCm}cm ${heightCm}cm`;
}

export function isContinuousPageProfile(profile: PageLayoutProfile | undefined): boolean {
  return profile === 'continuous';
}
