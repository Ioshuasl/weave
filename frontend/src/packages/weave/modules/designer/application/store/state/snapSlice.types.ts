import type { SnapGuides } from '../../../domain/designerSnap';

export interface SnapSlice {
  snapEnabled: boolean;
  activeSnapGuides: SnapGuides | null;

  setSnapEnabled: (enabled: boolean) => void;
  setActiveSnapGuides: (guides: SnapGuides | null) => void;
  clearSnapGuides: () => void;
}
