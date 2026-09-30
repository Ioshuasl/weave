import { normalizeReportDefinition, createEmptyReport } from '../../../report/domain';
import { createHistoryEntry } from '../../../history/domain';

const INITIAL_REPORT = createEmptyReport();
export const INITIAL_DATA: Record<string, unknown[]> = {};

export const NORMALIZED_INITIAL_REPORT = normalizeReportDefinition(INITIAL_REPORT);
export const INITIAL_HISTORY_ENTRY = createHistoryEntry(NORMALIZED_INITIAL_REPORT, INITIAL_DATA, {
  kind: 'init',
  label: 'Estado inicial',
});
