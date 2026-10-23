import {
  AlignEndHorizontal,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  UnfoldVertical,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import {
  ARRANGE_MODES_NEED_THREE,
  ARRANGE_MODE_LABELS,
  type ArrangeMode,
} from '../../domain/componentArrangement';
import { PropertyActionBar } from './controls/PropertyActionBar';
import { PropertyHint } from './controls/PropertyFields';

const ARRANGE_ACTIONS: { mode: ArrangeMode; icon: LucideIcon }[] = [
  { mode: 'alignLeft', icon: AlignStartVertical },
  { mode: 'alignTop', icon: AlignStartHorizontal },
  { mode: 'alignBottom', icon: AlignEndHorizontal },
  { mode: 'sameHeight', icon: UnfoldVertical },
  { mode: 'distributeHorizontal', icon: AlignHorizontalSpaceAround },
  { mode: 'distributeVertical', icon: AlignVerticalSpaceAround },
];

export function MultiSelectionProperties({
  count,
  onDuplicate,
  onRemove,
}: {
  count: number;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const components = useDesignerStore((state) => state.report.components);
  const bands = useDesignerStore((state) => state.report.bands);
  const arrangeComponents = useDesignerStore((state) => state.arrangeComponents);
  const selectedComponents = selectedIds.map((id) => components[id]).filter(Boolean);
  // Itens do mesmo bloco, ou todos elementos soltos (alinhados pela posição na folha)
  const sameBand =
    selectedComponents.length > 1 &&
    (selectedComponents.every((component) => component.parentId === selectedComponents[0].parentId) ||
      selectedComponents.every((component) => bands[component.parentId]?.element));
  const componentIds = selectedComponents.map((component) => component.id);

  return (
    <div className="space-y-3">
      <div>
        <span className="mb-1 block text-[12px] font-medium text-neutral-600">Alinhar e distribuir</span>
        <div className="grid grid-cols-6 gap-1">
          {ARRANGE_ACTIONS.map(({ mode, icon: Icon }) => {
            const disabled =
              !sameBand || (ARRANGE_MODES_NEED_THREE.includes(mode) && componentIds.length < 3);
            return (
              <button
                key={mode}
                type="button"
                title={ARRANGE_MODE_LABELS[mode]}
                aria-label={ARRANGE_MODE_LABELS[mode]}
                disabled={disabled}
                onClick={() => arrangeComponents(mode, componentIds)}
                className="flex h-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 disabled:pointer-events-none disabled:opacity-40"
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        <PropertyHint className="mt-1.5">
          {sameBand
            ? 'Distribuir precisa de 3 ou mais itens e mantém o primeiro e o último no lugar.'
            : 'Selecione itens do mesmo bloco (ou só elementos soltos) para alinhar ou distribuir.'}
        </PropertyHint>
      </div>

      <PropertyHint>
        {count} componentes selecionados. Arraste um deles para mover o grupo. Ctrl/Cmd+clique ou
        Shift+clique para alterar a seleção.
      </PropertyHint>
      <PropertyActionBar onDuplicate={onDuplicate} onRemove={onRemove} />
    </div>
  );
}
