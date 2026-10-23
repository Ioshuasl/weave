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

/** Porta: dicas de primeiro uso já vistas pelo usuário. */
export interface DesignerHintStorage {
  hasSeen(hintId: string): boolean;
  markSeen(hintId: string): void;
}

/** Porta: tour guiado do designer. */
export interface DesignerTourLauncher {
  /** `root` limita a busca de elementos à instância de Weave que abriu o tour. */
  start(root?: ParentNode | null): Promise<void>;
}

/** Portas de infraestrutura que o designer consome, fornecidas pelo composition root. */
export interface DesignerServices {
  panelStorage: PanelStateStorage;
  recentFields: RecentFieldStorage;
  hints: DesignerHintStorage;
  tour: DesignerTourLauncher;
  reportFiles: ReportFileGateway;
  imageEmbedder: ImageEmbedder;
}
