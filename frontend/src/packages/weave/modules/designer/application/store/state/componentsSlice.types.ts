import type { ReportBand } from '../../../../band/domain';
import { ReportComponent, ComponentType } from '../../../../components/common/domain';
import type { ArrangeMode } from '../../../domain/componentArrangement';

export interface ComponentsSlice {
  addComponent: (
    bandId: string,
    type: ComponentType,
    initialProps?: Partial<ReportComponent>,
    bandUpdates?: Partial<ReportBand>
  ) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ReportComponent>) => void;
  duplicateComponent: (id: string) => void;
  /** Alinha/distribui componentes da mesma banda (um passo no histórico) */
  arrangeComponents: (mode: ArrangeMode, ids: string[]) => void;
  moveComponents: (
    updates: Array<{ id: string; rect: { x: number; y: number } }>
  ) => void;
}
