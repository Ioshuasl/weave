import { createId } from '../../../shared/domain/id';
import {
  BUILTIN_PAGE_PRESET_CATALOG,
  DEFAULT_PAGE_PRESET_ID,
  DEFAULT_PAGE_SIZE_UNIT,
  presetDimensionsToPx,
} from '../../page/domain';
import type { ReportDefinition } from './report';

export function createEmptyReport(options?: { id?: string; name?: string }): ReportDefinition {
  const preset = BUILTIN_PAGE_PRESET_CATALOG.byId[DEFAULT_PAGE_PRESET_ID];
  const { width, height, margins } = presetDimensionsToPx(preset);

  return {
    id: options?.id ?? createId(),
    name: options?.name ?? 'Novo relatório',
    pages: [
      {
        id: createId(),
        name: 'Página 1',
        presetId: preset.id,
        profile: preset.profile,
        sizeUnit: DEFAULT_PAGE_SIZE_UNIT,
        width,
        height,
        margins,
        bands: [],
        dividers: [],
      },
    ],
    bands: {},
    components: {},
  };
}
