import type { ImageEmbedder } from '../../components/image/application';
import type { ReportFileGateway } from '../../report/application';
import type { DesignerPanelState } from '../domain/designerPanelState';

/** Porta: persistência do estado aberto/fechado dos painéis por relatório. */
export interface PanelStateStorage {
  load(reportId: string): DesignerPanelState | null;
  save(reportId: string, state: DesignerPanelState): void;
}

/** Porta: campos recentemente inseridos nos editores de expressão. */
export interface RecentFieldStorage {
  read(reportId?: string): string[];
  push(token: string, reportId?: string): void;
}

/** Porta: tour guiado do designer. */
export interface DesignerTourLauncher {
  start(): Promise<void>;
}

/** Portas de infraestrutura que o designer consome, fornecidas pelo composition root. */
export interface DesignerServices {
  panelStorage: PanelStateStorage;
  recentFields: RecentFieldStorage;
  tour: DesignerTourLauncher;
  reportFiles: ReportFileGateway;
  imageEmbedder: ImageEmbedder;
}
