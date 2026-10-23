import { type DesignerClipboard } from '../../../domain/designerClipboard';

export interface ClipboardSlice {
  clipboard: DesignerClipboard | null;

  copySelected: () => void;
  pasteToTargetBand: (targetBandId?: string) => void;
  clearClipboard: () => void;
}
