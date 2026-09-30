export interface ComponentGroupDrag {
  leaderId: string;
  bandId: string;
  memberIds: string[];
  startRects: Record<string, { x: number; y: number }>;
}

export interface BandGroupDrag {
  leaderId: string;
  memberIds: string[];
  startRects: Record<string, { x: number; y: number }>;
}

export interface DragSlice {
  /** Componente em arrasto — suspende fantasmas sem gravar posição no relatório */
  draggingComponentId: string | null;
  componentGroupDrag: ComponentGroupDrag | null;
  bandGroupDrag: BandGroupDrag | null;
  dragPreviewRects: Record<string, { x: number; y: number }> | null;

  setDraggingComponentId: (id: string | null) => void;
  beginComponentGroupDrag: (leaderId: string) => void;
  beginBandGroupDrag: (leaderId: string) => void;
  setDragPreviewRects: (rects: Record<string, { x: number; y: number }> | null) => void;
  commitComponentGroupDrag: (
    leaderId: string,
    leaderPos: { x: number; y: number }
  ) => void;
  commitBandGroupDrag: (leaderId: string, leaderPos: { x: number; y: number }) => void;
  cancelComponentGroupDrag: () => void;
  cancelBandGroupDrag: () => void;
}
