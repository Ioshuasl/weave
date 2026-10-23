import { ReportPage } from '../../../../page/domain';

export interface PagesSlice {
  selectPage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  addReportPage: () => void;
  duplicateReportPage: (pageId: string) => void;
  removeReportPage: (pageId: string) => void;
  renameReportPage: (pageId: string, name: string) => void;
  updatePage: (
    pageId: string,
    updates: Partial<ReportPage>,
    options?: { scaleContent?: boolean }
  ) => void;
  applyPagePreset: (pageId: string, presetId: string) => void;
  flipPageOrientation: (pageId: string) => void;
}
