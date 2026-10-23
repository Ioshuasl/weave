import { ReportBand } from '../../../band/domain';

export function filterSelection(selectedIds: string[], removedId: string): string[] {
  return selectedIds.filter((id) => id !== removedId);
}

export function filterSelectionForBandRemoval(
  selectedIds: string[],
  bandId: string,
  band: ReportBand
): string[] {
  return selectedIds.filter((id) => id !== bandId && !band.components.includes(id));
}
