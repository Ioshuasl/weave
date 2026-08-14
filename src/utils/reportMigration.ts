import type { ReportDefinition, ReportComponent, ReportPage } from '../types/report';
import { normalizeTextComponent } from './richTextUtils';
import { squareQrRect } from './componentRectDefaults';
import {
  cmToPx,
  DEFAULT_PAGE_PRESET_ID,
  DEFAULT_PAGE_SIZE_UNIT,
} from './pagePresets';

const LEGACY_A4_WIDTH = 794;
const LEGACY_A4_HEIGHT = 1123;

function inferPresetId(page: ReportPage): string {
  if (page.presetId) return page.presetId;
  if (page.width === LEGACY_A4_WIDTH && page.height === LEGACY_A4_HEIGHT) {
    return DEFAULT_PAGE_PRESET_ID;
  }
  return 'custom';
}

function normalizePage(page: ReportPage): ReportPage {
  const presetId = inferPresetId(page);
  return {
    ...page,
    presetId,
    profile: page.profile ?? 'document',
    sizeUnit: page.sizeUnit ?? DEFAULT_PAGE_SIZE_UNIT,
    margins: page.margins ?? {
      top: cmToPx(2.1),
      right: cmToPx(2.1),
      bottom: cmToPx(2.1),
      left: cmToPx(2.1),
    },
  };
}

export function normalizeReportDefinition(report: ReportDefinition): ReportDefinition {
  const components: Record<string, ReportComponent> = {};
  for (const [id, comp] of Object.entries(report.components)) {
    const normalized = normalizeTextComponent(comp);
    components[id] = normalized.type === 'qr'
      ? { ...normalized, rect: squareQrRect(normalized.rect) }
      : normalized;
  }

  const pages = report.pages.map(normalizePage);

  return { ...report, components, pages };
}
