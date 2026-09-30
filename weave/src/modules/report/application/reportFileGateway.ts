import type { ReportData } from '../../data-source/domain';
import type { ReportDefinition } from '../domain';

/** Porta: troca de relatórios com o usuário via arquivo JSON. */
export interface ReportFileGateway {
  download(report: ReportDefinition, data?: ReportData, filename?: string): void;
  pick(): Promise<File | null>;
  read(file: File): Promise<string>;
}
