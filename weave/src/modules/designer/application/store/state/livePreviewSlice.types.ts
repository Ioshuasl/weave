import { type LiveStylePreview } from '../../../../components/common/domain';
import { type LiveChartPreview } from '../../../../components/chart/domain';

export interface LivePreviewSlice {
  /** Preview visual de estilo durante edição (não persiste no relatório até commit) */
  liveStylePreview: LiveStylePreview | null;
  /** Preview visual de chartProps durante edição (sem histórico até commit) */
  liveChartPreview: LiveChartPreview | null;

  setLiveStylePreview: (preview: LiveStylePreview | null) => void;
  clearLiveStylePreview: () => void;
  setLiveChartPreview: (preview: LiveChartPreview | null) => void;
  clearLiveChartPreview: () => void;
}
