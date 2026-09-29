import type { ReportDefinition } from '../../report/domain';

export type SelectionMode = 'replace' | 'add' | 'toggle';

export function getPrimarySelectedId(selectedIds: string[]): string | null {
  return selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
}

export function isIdSelected(selectedIds: string[], id: string): boolean {
  return selectedIds.includes(id);
}

export function resolveSelectionAfterRestore(
  selectedIds: string[],
  report: ReportDefinition
): string[] {
  return selectedIds.filter((id) => report.bands[id] || report.components[id]);
}

export function getSelectedComponentIds(
  selectedIds: string[],
  report: ReportDefinition
): string[] {
  return selectedIds.filter((id) => Boolean(report.components[id]));
}

export function getSelectedBandIds(
  selectedIds: string[],
  report: ReportDefinition
): string[] {
  return selectedIds.filter((id) => Boolean(report.bands[id]));
}

/** Componentes selecionados que pertencem à mesma banda */
export function getSelectedComponentsInBand(
  selectedIds: string[],
  report: ReportDefinition,
  bandId: string
): string[] {
  const band = report.bands[bandId];
  if (!band) return [];
  const selected = new Set(selectedIds);
  return band.components.filter((id) => selected.has(id));
}

export function applySelectionMode(
  currentIds: string[],
  id: string,
  report: ReportDefinition,
  mode: SelectionMode
): string[] {
  const isComponent = Boolean(report.components[id]);
  const isBand = Boolean(report.bands[id]);
  if (!isComponent && !isBand) return currentIds;

  if (mode === 'replace') {
    return [id];
  }

  if (isBand) {
    if (mode === 'toggle') {
      return currentIds.includes(id)
        ? currentIds.filter((x) => x !== id)
        : [...currentIds, id];
    }
    return currentIds.includes(id) ? currentIds : [...currentIds, id];
  }

  const withoutBands = currentIds.filter((x) => !report.bands[x]);

  if (mode === 'toggle') {
    return withoutBands.includes(id)
      ? withoutBands.filter((x) => x !== id)
      : [...withoutBands, id];
  }

  return withoutBands.includes(id) ? withoutBands : [...withoutBands, id];
}
