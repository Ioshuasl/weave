import type { ReportCalculo } from '../../expression/domain/calculos';
import type { ReportBand } from '../../band/domain';
import type { ReportComponent } from '../../components/common/domain';
import type { ReportPage } from '../../page/domain';

export interface ReportDefinition {
  id: string;
  name: string;
  pages: ReportPage[];
  bands: Record<string, ReportBand>;
  components: Record<string, ReportComponent>;
  /** Cálculos com nome, usados nos textos e colunas como {Nome do cálculo}. */
  calculos?: ReportCalculo[];
}
