import type { ReportPreviewSheet } from './paginationEngine';

export type PreviewViewMode = 'single' | 'multi' | 'book';

export const PREVIEW_VIEW_MODES: Array<{
  id: PreviewViewMode;
  label: string;
  title: string;
}> = [
  {
    id: 'single',
    label: 'Página simples',
    title: 'Página simples — uma folha por vez',
  },
  {
    id: 'multi',
    label: 'Múltiplas páginas',
    title: 'Múltiplas páginas — grade de folhas',
  },
  {
    id: 'book',
    label: 'Livro',
    title: 'Livro — folhas lado a lado (frente e verso)',
  },
];

export const PREVIEW_BOOK_SPREAD_GAP_PX = 32;
export const PREVIEW_MULTI_GRID_GAP_PX = 24;

export type BookSpread = {
  left?: ReportPreviewSheet;
  right?: ReportPreviewSheet;
};

/** Agrupa folhas em pares estilo Word: capa à direita, depois frente|verso. */
export function groupSheetsIntoBookSpreads(
  sheets: ReportPreviewSheet[]
): BookSpread[] {
  if (sheets.length === 0) return [];

  const spreads: BookSpread[] = [{ right: sheets[0] }];

  for (let i = 1; i < sheets.length; i += 2) {
    spreads.push({
      left: sheets[i],
      right: sheets[i + 1],
    });
  }

  return spreads;
}

export function getPreviewLayoutNaturalWidth(
  viewMode: PreviewViewMode,
  referencePageWidth: number,
  multiColumnCount: number
): number {
  if (viewMode === 'book') {
    return referencePageWidth * 2 + PREVIEW_BOOK_SPREAD_GAP_PX;
  }
  if (viewMode === 'multi' && multiColumnCount > 1) {
    return (
      referencePageWidth * multiColumnCount +
      PREVIEW_MULTI_GRID_GAP_PX * (multiColumnCount - 1)
    );
  }
  return referencePageWidth;
}

export function canUseMultiPageView(
  sheetCount: number,
  isContinuous: boolean
): boolean {
  return !isContinuous && sheetCount > 1;
}

export function canUseBookView(sheetCount: number, isContinuous: boolean): boolean {
  return !isContinuous && sheetCount > 1;
}
