import { ReportComponent, ComponentType } from '../../../../components/common/domain';

export interface ComponentsSlice {
  addComponent: (bandId: string, type: ComponentType, initialProps?: Partial<ReportComponent>) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ReportComponent>) => void;
  duplicateComponent: (id: string) => void;
  moveComponents: (
    updates: Array<{ id: string; rect: { x: number; y: number } }>
  ) => void;
}
