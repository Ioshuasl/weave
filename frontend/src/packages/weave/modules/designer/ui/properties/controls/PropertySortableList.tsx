import { Reorder, useDragControls, type DragControls } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { cn } from '../../../../../shared/ui/cn';

function SortableItem({
  id,
  className,
  onDragEnd,
  children,
}: {
  id: string;
  className?: string;
  onDragEnd: () => void;
  children: (controls: DragControls) => ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', zIndex: 10 }}
      className={cn('relative rounded-lg bg-weave-surface', className)}
    >
      {children(controls)}
    </Reorder.Item>
  );
}

/** Lista reordenável por alça de arraste; só chama `onCommit` ao soltar. */
export function PropertySortableList({
  ids,
  onCommit,
  renderItem,
  className,
}: {
  ids: string[];
  onCommit: (ids: string[]) => void;
  /** Receba `controls` e ligue `controls.start(event)` ao `onPointerDown` da alça */
  renderItem: (id: string, controls: DragControls) => ReactNode;
  className?: string;
}) {
  const [draft, setDraft] = useState<string[] | null>(null);
  const order = draft ?? ids;

  const handleDragEnd = () => {
    if (draft && draft.join() !== ids.join()) onCommit(draft);
    setDraft(null);
  };

  return (
    <Reorder.Group as="div" axis="y" values={order} onReorder={setDraft} className={cn('space-y-1', className)}>
      {order.map((id) => (
        <SortableItem key={id} id={id} onDragEnd={handleDragEnd}>
          {(controls) => renderItem(id, controls)}
        </SortableItem>
      ))}
    </Reorder.Group>
  );
}
