import { getReportPage, resolveActivePageId } from '../../../report/domain';
import { ReportPage } from '../../../page/domain';
import type { DesignerState } from './designerState';

export function stateActivePageId(state: DesignerState): string {
  return resolveActivePageId(state.report, state.activePageId);
}

export function stateActivePage(state: DesignerState): ReportPage {
  const page = getReportPage(state.report, state.activePageId);
  if (!page) {
    throw new Error('Página ativa não encontrada');
  }
  return page;
}
