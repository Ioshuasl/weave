import type { ReportPage } from '../../page/domain';
import type { ReportBand } from '../../band/domain';
import type { ReportComponent } from '../../components/common/domain';

export interface ReportDefinition {
  id: string;
  name: string;
  pages: ReportPage[];
  bands: Record<string, ReportBand>;
  components: Record<string, ReportComponent>;
}
