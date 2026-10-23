import type { ReportDefinition } from '../../report/domain';

/** Ids do que mudou entre dois estados do relatório (comparação por referência: o assistente atualiza de forma imutável). */
export interface ReportChanges {
  components: string[];
  bands: string[];
}

/** Bandas cujo único "efeito" foi crescer ou receber/perder componentes não contam: o componente novo já é o destaque */
const BAND_LAYOUT_ONLY_KEYS = new Set(['components', 'height']);

const hasBandChanged = (before: Record<string, unknown>, after: Record<string, unknown>): boolean =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])].some((key) => !BAND_LAYOUT_ONLY_KEYS.has(key) && before[key] !== after[key]);

export function diffReportIds(before: ReportDefinition, after: ReportDefinition): ReportChanges {
  return {
    // componente removido não existe mais no canvas: não há onde destacar
    components: Object.keys(after.components).filter((id) => before.components[id] !== after.components[id]),
    bands: Object.keys(after.bands).filter((id) => {
      const previous = before.bands[id];
      return !previous || hasBandChanged(previous as unknown as Record<string, unknown>, after.bands[id] as unknown as Record<string, unknown>);
    }),
  };
}

export const hasReportChanges = (changes: ReportChanges): boolean => changes.components.length + changes.bands.length > 0;
