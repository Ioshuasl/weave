import type { PagePresetDefinition } from '../utils/pagePresets';

/** Presets extras injetados pelo host na demo (Fase 3.5) */
export const DEMO_HOST_PAGE_PRESETS: PagePresetDefinition[] = [
  {
    id: 'cartorio-oficio',
    label: 'Ofício cartório (margens largas)',
    group: 'host',
    profile: 'document',
    widthCm: 21,
    heightCm: 29.7,
    defaultMarginsCm: { top: 3, right: 2.5, bottom: 3, left: 2.5 },
  },
];
