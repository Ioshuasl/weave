import type { PagePresetDefinition } from 'weave';

export const PRESET_CARTORIO_OFICIO: PagePresetDefinition = {
  id: 'cartorio-oficio',
  label: 'Ofício cartório (margens largas)',
  group: 'host',
  profile: 'document',
  widthCm: 21,
  heightCm: 29.7,
  defaultMarginsCm: { top: 3, right: 2.5, bottom: 3, left: 2.5 },
};

/** Etiqueta avulsa de ato extraprotocolar (TJGO) — 9×5 cm, sem margem */
export const PRESET_ETIQUETA_EXTRAPROTOCOLAR: PagePresetDefinition = {
  id: 'cartorio-etiqueta-extraprotocolar',
  label: 'Etiqueta extraprotocolar 9×5 cm',
  group: 'host',
  profile: 'label',
  widthCm: 9,
  heightCm: 5,
  defaultMarginsCm: { top: 0, right: 0, bottom: 0, left: 0 },
};

/** Presets extras injetados pelo host na demo (Fase 3.5) */
export const DEMO_HOST_PAGE_PRESETS: PagePresetDefinition[] = [
  PRESET_CARTORIO_OFICIO,
  PRESET_ETIQUETA_EXTRAPROTOCOLAR,
];
